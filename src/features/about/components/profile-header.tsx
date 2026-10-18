import Image from "next/image";
import { PROFILE } from "../constants/profile";

type ProfileHeaderProps = {
  /** Localised role line, e.g. "Software engineer · Transport management systems". */
  roleLine: string;
};

/**
 * Portrait + name + role.
 *
 * The name is the page's `h1`: the page *is* the About page, so repeating
 * "About" as the heading wastes the most prominent line on the screen.
 */
export function ProfileHeader({ roleLine }: ProfileHeaderProps) {
  return (
    <header className="flex flex-col items-center text-center">
      <div className="relative size-40 sm:size-44">
        {/* Ring sits behind the photo so the portrait edge stays crisp. */}
        <div
          aria-hidden
          className="absolute -inset-1 rounded-full border border-border"
        />
        <Image
          src={PROFILE.photo.src}
          alt={PROFILE.photo.alt}
          width={PROFILE.photo.width}
          height={PROFILE.photo.height}
          priority
          sizes="(max-width: 640px) 160px, 176px"
          className="size-full rounded-full object-cover"
        />
      </div>

      <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-ink-primary">
        {PROFILE.name}
      </h1>

      <p className="mt-1.5 text-sm text-ink-secondary">{roleLine}</p>
    </header>
  );
}
