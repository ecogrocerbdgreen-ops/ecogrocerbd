# EcoGrocer BD — starter catalogue price references

**Reference check date: 10 November 2026**  
**Currency:** Bangladeshi taka (৳)  
**Purpose:** editable demonstration prices for the first website build. These are not supplier quotations, a live price feed, guaranteed EcoGrocer selling prices, or confirmed stock.

Prices can differ by city, retailer, brand, grade, product size, preparation, and delivery location. A displayed product pack is not always directly comparable with a loose-market kilogram price. Confirm all 32 prices with EcoGrocer's own suppliers before accepting real orders.

## Grocery

Current comparison values were checked against Kombeshi's 10 November 2026 supermarket comparison / live-price search result. Chinigura rice uses the same-day comparison page.

| Product | Prototype pack | Prototype price | Reference |
|---|---:|---:|---|
| Miniket rice | 5 kg | ৳389 | Kombeshi live comparison, attributed to Chaldal |
| Soybean oil | 1 L | ৳189 | Kombeshi live comparison, attributed to Agora |
| Masoor dal | 1 kg | ৳109 | Kombeshi live comparison, attributed to Chaldal |
| Sugar | 1 kg | ৳80 | Kombeshi live comparison, attributed to Shwapno |
| Layer eggs | 12 pcs | ৳135 | Kombeshi live comparison, attributed to Chaldal |
| Atta / wheat flour | 2 kg | ৳115 | Kombeshi live comparison, attributed to Agora |
| Iodized salt | 1 kg | ৳37 | Kombeshi live comparison, attributed to Agora |
| Chinigura rice | 1 kg | ৳133 | Kombeshi's same-day price comparison lists Chaldal at ৳133 and other retailers at nearby prices |

Sources: [Kombeshi live price comparison](https://kombeshi.com/), [Kombeshi — today's supermarket price comparison](https://kombeshi.com/ajker-bazar-dor).

## Vegetables

Prices and pack sizes below are taken from Chaldal's Dhaka Fresh Vegetables listing. This is an online retailer reference, not a citywide market average.

| Product | Prototype pack | Prototype price | Reference |
|---|---:|---:|---|
| Regular potato | 1 kg | ৳29 | Chaldal Fresh Vegetables |
| Red tomato | 500 g | ৳99 | Chaldal Fresh Vegetables |
| Coriander leaves | 100 g | ৳25 | Chaldal Fresh Vegetables |
| Imported garlic | 500 g | ৳79 | Chaldal Fresh Vegetables (listed promotional price) |
| Green chilli | 250 g | ৳89 | Chaldal Fresh Vegetables |
| Local cucumber | 500 g | ৳39 | Chaldal Fresh Vegetables |
| Local onion | 1 kg | ৳39 | Chaldal Fresh Vegetables |
| Local carrot | 500 g | ৳49 | Chaldal Fresh Vegetables |

Source: [Chaldal — Fresh Vegetables](https://chaldal.com/fresh-vegetable). The page may change its assortment or price after this check.

## Meat

These are product-specific pack prices from Chaldal's online Meat catalogue, rather than loose-market meat quotations.

| Product | Prototype pack | Prototype price | Reference |
|---|---:|---:|---|
| Broiler chicken, skin off | 1 kg | ৳359 | Chaldal Meat |
| Broiler chicken, skin on | 1 kg | ৳319 | Chaldal Meat |
| Chicken leg, skin on | 1 kg | ৳519 | Chaldal Meat |
| Deshi chicken, skin off | 500 g | ৳639 | Chaldal Meat |
| Beef boneless | 500 g | ৳619 | Chaldal Meat |
| Beef bone-in | 1 kg | ৳799 | Chaldal Meat |
| Beef liver | 500 g | ৳409 | Chaldal Meat |
| Mutton bone-in | 1 kg | ৳1,249 | Chaldal Meat |

Source: [Chaldal — Meat](https://chaldal.com/meat-new). Product availability and prices can change; confirm pack size and preparation with the supplier.

## Fish

For common fish varieties, values use Dhaka market ranges reported in early November 2026. Where a range was reported, the starter catalogue uses a rounded midpoint for a simple editable price. Mrigel uses the FisheryBD retail reference updated 26 October 2026 because the newer reports consulted did not quote a Mrigel price.

| Product | Prototype pack | Prototype price | Reference / method |
|---|---:|---:|---|
| Tilapia | 1 kg | ৳250 | 8 Nov market report range ৳220–280; midpoint |
| Rui | 1 kg | ৳400 | 8 Nov market report range ৳350–450; midpoint |
| Katla | 1 kg | ৳600 | 8 Nov report's large-katla range ৳450–800; indicative midpoint |
| Mrigel | 1 kg | ৳250 | FisheryBD Dhaka retail reference |
| Shing | 1 kg | ৳450 | 8 Nov market report: around ৳450 |
| Pangas | 1 kg | ৳240 | 8 Nov market report range ৳230–250; midpoint |
| Pabda | 1 kg | ৳400 | 6 Nov market report range ৳380–420; midpoint |
| Farmed koi | 1 kg | ৳210 | 6 Nov market report range ৳200–220; midpoint |

Sources: [Daily People's Time — Dhaka fish and meat prices, published 8 November 2026](https://dailypeoplestime.com/details.php?id=2955), [Dhaka Tribune — Winter vegetables bring relief, fish, meat and egg prices remain high, 6 November 2026](https://www.dhakatribune.com/bangladesh/agriculture/423876/winter-vegetables-bring-relief-fish-meat-and-egg), [FisheryBD daily fish market prices](https://fisherybd.com/market-prices).

## Important before launch

1. These are starter reference prices only. They must be reviewed and replaced with EcoGrocer's negotiated purchase prices and chosen retail margins.
2. Fresh fish, meat, and vegetables should have an explicit unit, grade, preparation method, and net weight. The sample list is not a complete supplier specification.
3. A live e-commerce release needs server-side price validation. Never trust a price sent by the browser as the final order amount.
4. The UI currently labels the figures as sample/reference prices. No payment, order submission, Firebase write, or stock reservation is enabled in this phase.