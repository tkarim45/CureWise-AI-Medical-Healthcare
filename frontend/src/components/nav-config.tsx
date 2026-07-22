import { Icon } from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
};

/** The AI tools — shown as dashboard tiles and in the sidebar's main group. */
export const TOOLS: NavItem[] = [
  {
    href: "/chat",
    label: "Health assistant",
    description: "Ask anything and get a grounded, plain-language answer.",
    icon: Icon.Chat,
  },
  {
    href: "/report",
    label: "Blood report reader",
    description: "Upload a lab PDF and get it explained in plain words.",
    icon: Icon.Report,
  },
  {
    href: "/screening",
    label: "Image screening",
    description: "Screen a medical image across seven trained models.",
    icon: Icon.Scan,
  },
  {
    href: "/skin",
    label: "Skin & acne check",
    description: "Get a first read on a skin photo and what to do next.",
    icon: Icon.Skin,
  },
  {
    href: "/emergency",
    label: "Nearby care",
    description: "Find hospitals near you when it matters most.",
    icon: Icon.Siren,
  },
];

/** Account / secondary destinations. */
export const ACCOUNT: NavItem[] = [
  {
    href: "/history",
    label: "Medical history",
    description: "Your conditions, allergies and notes.",
    icon: Icon.History,
  },
  {
    href: "/profile",
    label: "Profile",
    description: "Your account details.",
    icon: Icon.User,
  },
];
