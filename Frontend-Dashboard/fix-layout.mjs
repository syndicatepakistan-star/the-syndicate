import fs from "fs";

const p = "src/components/dashboard/path/CourseFlow.tsx";
const s = fs.readFileSync(p, "utf8");

const pattern =
  /            <\/AnimatePresence>\r?\n          <\/div>\r?\n          <div className="flex justify-center lg:hidden">[\s\S]*?        <\/motion.div>\r?\n      <\/motion.div>\r?\n    <\/motion.div>/;

const replacement = `            </AnimatePresence>
        </div>

        <div className="flex justify-center lg:col-start-4 lg:row-start-1 lg:hidden">
          <ArrowConnectorVertical />
        </div>
        <div className="hidden min-h-[clamp(13rem,26vh,16rem)] items-center justify-center lg:col-start-4 lg:flex lg:row-start-1">
          <ArrowConnectorHorizontal className="w-full max-w-[3.5rem]" />
        </div>

        <div className="relative min-h-[clamp(13rem,26vh,16rem)] min-w-0 lg:col-start-5 lg:row-start-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={\`\${goal}-\${slideIndex}-c\`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex h-full w-full min-w-0 flex-col"
            >
              <CourseFlowCard
                course={movingC}
                variant="future"
                isAnchor={false}
                cardFrame={cardFrame}
                onContinue={go}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>`;

const fixed = s.replace(pattern, replacement);
if (fixed === s) {
  console.error("regex did not match");
  const idx = s.indexOf('flex justify-center lg:hidden');
  console.error("found lg:hidden at", idx);
  process.exit(1);
}
fs.writeFileSync(p, fixed);
console.log("fixed");
