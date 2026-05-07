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
        progress.textContent = "Upload complete. Now click Save to trigger processing.";
      } catch (e) {
        progress.textContent = `Upload failed: ${e && e.message ? e.message : "Unknown error"}`;
      } finally {
        button.disabled = false;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
