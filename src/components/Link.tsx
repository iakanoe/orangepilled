"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, type ComponentProps } from "react";
import { nativeNavigate } from "./NativeTransitions";

type Props = ComponentProps<typeof NextLink>;

// Drop-in replacement for `next/link` that routes forward navigations through
// the View Transitions API (see NativeTransitions) for a native push feel.
// Falls back to plain next/link behaviour for object hrefs, external links,
// new tabs, modified clicks, or same-page links.
const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { href, replace, onClick, target, ...rest },
  ref,
) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <NextLink
      {...rest}
      href={href}
      replace={replace}
      target={target}
      ref={ref}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (typeof href !== "string") return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
          return;
        if (target && target !== "_self") return;
        if (href.startsWith("#") || /^[a-z]+:\/\//i.test(href)) return;
        if (href.split(/[?#]/)[0] === pathname) return;
        e.preventDefault();
        nativeNavigate("forward", () => {
          if (replace) router.replace(href);
          else router.push(href);
        });
      }}
    />
  );
});

export default Link;
