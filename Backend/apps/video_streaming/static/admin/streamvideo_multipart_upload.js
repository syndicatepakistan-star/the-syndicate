(function () {
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  }

  function parseStreamVideoId() {
    const m = window.location.pathname.match(/\/streamvideo\/(\d+)\/change\/?$/);
    if (!m) return null;
    const id = Number(m[1]);
    return Number.isFinite(id) ? id : null;
  }

  async function postJson(url, payload) {
    const csrftoken = getCookie("csrftoken");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || "Request failed");
    }
    return data;
  }

  async function uploadLargeFile(file, streamVideoId, titleValue, ui) {
    const started = await postJson("/api/streaming/uploads/start/", {
      stream_video_id: streamVideoId || null,
      title: titleValue || "",
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      part_size_mb: 64,
    });
    const key = started.key;
    const uploadId = started.upload_id;
    const partSize = started.part_size || 64 * 1024 * 1024;
    const totalParts = Math.ceil(file.size / partSize);
    const parts = [];

    try {
      for (let partNo = 1; partNo <= totalParts; partNo += 1) {
        const start = (partNo - 1) * partSize;
        const end = Math.min(start + partSize, file.size);
        const blob = file.slice(start, end);
        const sign = await postJson("/api/streaming/uploads/sign-part/", {
          key,
          upload_id: uploadId,
          part_number: partNo,
        });
        const putRes = await fetch(sign.url, {
          method: "PUT",
          body: blob,
        });
        if (!putRes.ok) {
          throw new Error(`Part ${partNo} upload failed`);
        }
        const eTag = putRes.headers.get("ETag") || "";
        parts.push({ PartNumber: partNo, ETag: eTag });
        const pct = Math.floor((partNo / totalParts) * 100);
        ui.progress.textContent = `Uploading ${pct}% (${partNo}/${totalParts})`;
      }

      await postJson("/api/streaming/uploads/complete/", {
        stream_video_id: streamVideoId || null,
        key,
        upload_id: uploadId,
        parts,
      });
      return key;
    } catch (err) {
      try {
        await postJson("/api/streaming/uploads/abort/", { key, upload_id: uploadId });
      } catch (_) {
        // Ignore abort errors.
      }
      throw err;
    }
  }

  function init() {
    const streamVideoId = parseStreamVideoId();
    const titleInput = document.getElementById("id_title");
    const multipartInput = document.getElementById("id_multipart_video");
    const hiddenKeyInput = document.getElementById("id_multipart_uploaded_key");
    if (!multipartInput || !hiddenKeyInput) return;

    const container = document.createElement("div");
    container.style.marginTop = "8px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Upload large file to bucket";
    button.style.width = "fit-content";
    button.style.padding = "6px 10px";

    const progress = document.createElement("div");
    progress.style.fontSize = "12px";
    progress.style.opacity = "0.9";

    container.appendChild(button);
    container.appendChild(progress);
    multipartInput.parentElement.appendChild(container);

    const ui = { button, progress };

    button.addEventListener("click", async function () {
      const file = multipartInput.files && multipartInput.files[0];
      if (!file) {
        progress.textContent = "Select a file first.";
        return;
      }
      button.disabled = true;
      progress.textContent = "Preparing multipart upload...";
      try {
        const titleValue = titleInput && titleInput.value ? String(titleInput.value).trim() : "";
        const key = await uploadLargeFile(file, streamVideoId, titleValue, ui);
        hiddenKeyInput.value = key;
        // Critical: if this file stays selected, a normal Save POST sends it again to Django (slow / huge).
        multipartInput.value = "";
        progress.textContent =
          "Upload complete. File field cleared. Click Save — only metadata + bucket key are sent (fast).";
      } catch (e) {
        progress.textContent = `Upload failed: ${e && e.message ? e.message : "Unknown error"}`;
      } finally {
        button.disabled = false;
      }
    });
  }

  /**
   * Django admin posts the whole form when you click Save; the browser does not show upload %.
   * When a new file is selected on #id_original_video, submit via XHR so upload progress is visible.
   */
  function initSaveUploadProgress() {
    const form =
      document.getElementById("streamvideo_form") ||
      document.getElementById("membershipstreamvideo_form");
    const fileInput = document.getElementById("id_original_video");
    if (!form || !fileInput || form.dataset.synSaveUploadBound === "1") return;
    form.dataset.synSaveUploadBound = "1";

    const barWrap = document.createElement("div");
    barWrap.id = "syn-admin-save-upload-progress";
    barWrap.setAttribute("role", "status");
    barWrap.style.cssText =
      "display:none;margin:0 0 16px;padding:12px 14px;background:#1e3a4f;color:#e8f4fc;border:1px solid #417690;border-radius:6px;max-width:720px;";
    const title = document.createElement("div");
    title.style.cssText = "font-weight:700;font-size:13px;margin-bottom:8px;";
    title.textContent = "Saving…";
    const pctLine = document.createElement("div");
    pctLine.style.cssText = "font-size:12px;margin-bottom:8px;opacity:0.95;";
    const barBg = document.createElement("div");
    barBg.style.cssText = "height:10px;background:rgba(255,255,255,0.2);border-radius:5px;overflow:hidden;";
    const barFill = document.createElement("div");
    barFill.style.cssText = "height:100%;width:0%;background:#f5c542;transition:width 0.08s ease-out;";
    barBg.appendChild(barFill);
    barWrap.appendChild(title);
    barWrap.appendChild(pctLine);
    barWrap.appendChild(barBg);
    const content = document.getElementById("content");
    if (content) {
      content.insertBefore(barWrap, content.firstChild);
    } else {
      form.parentElement.insertBefore(barWrap, form);
    }

    function mb(n) {
      return (n / (1024 * 1024)).toFixed(1) + " MB";
    }

    function setBar(loaded, total) {
      barWrap.style.display = "block";
      if (total > 0) {
        const pct = Math.min(100, Math.round((loaded / total) * 100));
        pctLine.textContent = pct + "% — " + mb(loaded) + " / " + mb(total);
        barFill.style.width = pct + "%";
      } else {
        pctLine.textContent = "Preparing upload…";
        barFill.style.width = "0%";
      }
    }

    function setSubmitRowDisabled(disabled) {
      document.querySelectorAll(".submit-row input[type=submit], .submit-row button[type=submit]").forEach(function (btn) {
        btn.disabled = disabled;
      });
    }

    function looksLikeValidationError(html) {
      if (!html || typeof html !== "string") return false;
      return (
        html.indexOf("errorlist") !== -1 ||
        html.indexOf("errornote") !== -1 ||
        html.indexOf("non_field_errors") !== -1 ||
        html.indexOf("class=\"errors\"") !== -1
      );
    }

    form.addEventListener(
      "submit",
      function (e) {
        const multipartKeyInput = document.getElementById("id_multipart_uploaded_key");
        const multipartInputEl = document.getElementById("id_multipart_video");
        const mustStripMultipart =
          multipartKeyInput &&
          String(multipartKeyInput.value || "").trim() &&
          multipartInputEl &&
          multipartInputEl.files &&
          multipartInputEl.files.length > 0;

        const origHasFile = fileInput.files && fileInput.files.length > 0;

        if (!mustStripMultipart && !origHasFile) {
          return;
        }

        e.preventDefault();

        const fd = new FormData(form);
        if (mustStripMultipart) {
          fd.delete("multipart_video");
        }
        if (e.submitter && e.submitter.name) {
          fd.append(e.submitter.name, e.submitter.value);
        }

        const xhr = new XMLHttpRequest();
        xhr.open("POST", form.action || window.location.href);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        xhr.upload.addEventListener("progress", function (ev) {
          if (ev.lengthComputable) {
            setBar(ev.loaded, ev.total);
          } else {
            setBar(ev.loaded, ev.loaded + 1);
          }
        });

        xhr.onerror = function () {
          setSubmitRowDisabled(false);
          barWrap.style.display = "none";
          window.alert("Save failed: network error. Check your connection and try again.");
        };

        xhr.onload = function () {
          setSubmitRowDisabled(false);
          const text = xhr.responseText || "";
          if (xhr.status >= 200 && xhr.status < 300) {
            if (looksLikeValidationError(text)) {
              document.open();
              document.write(text);
              document.close();
              return;
            }
            window.location.href = xhr.responseURL || form.action || window.location.href;
            return;
          }
          barWrap.style.display = "none";
          window.alert("Save failed (" + xhr.status + "). Fix any errors and try again.");
        };

        setSubmitRowDisabled(true);
        if (origHasFile && fileInput.files[0]) {
          title.textContent = "Uploading with Save…";
          setBar(0, Math.max(1, fileInput.files[0].size));
        } else {
          title.textContent = "Saving…";
          setBar(0, 1);
        }
        xhr.send(fd);
      },
      true
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    init();
    initSaveUploadProgress();
  });
})();
