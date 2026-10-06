import siteJson from '../data/site.json';

export interface NavItem {
  label: string;
  href: string;
}

export interface Site {
  name: string;
  wordmarkSub: string;
  description: string;
  tagline: string;
  phoneDisplay: string;
  phoneHref: string;
  zaloUrl: string;
  facebookUrl: string;
  messengerUrl: string;
  hours: string;
  hoursShort: string;
  replyWithin: string;
  deliveryArea: string;
  yearsInBusiness: number;
  nav: NavItem[];
}

export const site: Site = siteJson as Site;
