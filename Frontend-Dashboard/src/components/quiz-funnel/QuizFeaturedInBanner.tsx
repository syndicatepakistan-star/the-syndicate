import Image from "next/image";
import { PRESS_FEATURED_LOGOS } from "@/lib/heroFeaturedLogos";

/** Static “As Featured In” strip — LLM / Forbes / GQ with article backlinks. */
const FEATURED_ORDER = ["LLM", "Forbes", "GQ"] as const;

function orderedPressLogos() {
  return FEATURED_ORDER.map((key) => {
    const found = PRESS_FEATURED_LOGOS.find((logo) =>
      logo.alt.toLowerCase().includes(key.toLowerCase()),
    );
    return found;
  }).filter((logo): logo is (typeof PRESS_FEATURED_LOGOS)[number] => Boolean(logo));
}

export function QuizFeaturedInBanner() {
  const logos = orderedPressLogos();
  if (logos.length === 0) return null;

  return (
    <aside className="quiz-featured-in" aria-label="As featured in">
      <p className="quiz-featured-in__heading">As Featured In</p>
      <ul className="quiz-featured-in__logos">
        {logos.map((logo) => (
          <li
            key={logo.src}
            className={`quiz-featured-in__item${
              /forbes/i.test(logo.alt) ? " quiz-featured-in__item--dark" : ""
            }`}
          >
            {logo.href ? (
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="quiz-featured-in__link"
                aria-label={`${logo.alt} — open article`}
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={48}
                  className="quiz-featured-in__img"
                  quality={75}
                  sizes="(max-width: 640px) 96px, 140px"
                />
              </a>
            ) : (
              <span className="quiz-featured-in__link quiz-featured-in__link--static">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={48}
                  className="quiz-featured-in__img"
                  quality={75}
                  sizes="(max-width: 640px) 96px, 140px"
                />
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="quiz-featured-in__cta">Checkout the links</p>
    </aside>
  );
}
