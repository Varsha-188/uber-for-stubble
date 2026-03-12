export type StubbleListing = {
  quantity: string;
  location: string;
};

export const listings: StubbleListing[] = [];

export function addListing(listing: StubbleListing) {
  listings.push(listing);
}
