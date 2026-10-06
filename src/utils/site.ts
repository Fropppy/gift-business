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
  /** Apps Script web-app URL the enquiry form POSTs to; empty = form stays in honesty-gate mode. */
  orderEndpoint: string;
  nav: NavItem[];
}

export const site: Site = siteJson as Site;
