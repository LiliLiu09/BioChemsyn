import type { Product } from "./types";

export const coreCategories = [
  {
    slug: "udp-sugars", name: "UDP-Sugars", nameZh: "UDP-糖",
    keys: ["UDP-糖", "修饰型 UDP-糖"],
    description: "Browse UDP-sugars and modified UDP-sugar reagents for glycochemistry research. Compare product identities and request a quotation from KASONS.",
    overview: "UDP-sugars are uridine diphosphate-linked carbohydrates used in the study of sugar metabolism and glycosyltransferase reactions. This collection brings together glucose, galactose, amino-sugar and modified sugar derivatives.",
    selection: "Select the sugar identity, stereochemistry and chemical form required by your protocol. Free acids and salts can have different formulae and molecular weights. For modified donors, confirm the position and identity of the modification before ordering.",
    questions: "Include the catalog number, required quantity and intended analytical or synthesis workflow in your enquiry. Ask for confirmation of purity, counterion, pack size and batch documentation."
  },
  {
    slug: "gdp-sugars", name: "GDP-Sugars", nameZh: "GDP-糖",
    keys: ["GDP-糖", "修饰型 GDP-糖"],
    description: "Explore GDP-fucose, GDP-mannose and modified GDP-sugars. Compare CAS numbers and chemical forms, and enquire about KASONS research reagents.",
    overview: "GDP-sugars are guanosine diphosphate-linked carbohydrates. The collection includes fucose and mannose derivatives, together with modified GDP-linked sugars for research enquiries.",
    selection: "Check sugar configuration and salt form rather than relying on the shortened GDP-sugar name alone. Match the exact catalog entry to your protocol and distinguish unmodified donors from labelled or functionalised derivatives.",
    questions: "Specify the catalog number and quantity, and request confirmation of chemical form, purity, available packaging and supporting analytical documentation."
  },
  {
    slug: "cmp-sialic-acids", name: "CMP-Sialic Acids", nameZh: "CMP-唾液酸",
    keys: ["CMP-唾液酸/非酮糖"],
    description: "Find CMP-linked sialic acids, including CMP-Neu5Ac and CMP-Neu5Gc. Review KASONS catalog entries and enquire about specifications and supply.",
    overview: "CMP-linked sialic acids are nucleotide-activated carbohydrates relevant to sialylation research. This collection includes N-acetylneuraminic acid, N-glycolylneuraminic acid and modified nonulosonic-acid derivatives.",
    selection: "Neu5Ac, Neu5Gc and modified sialic acids represent different chemical identities. Confirm the substituents, counterion and chemical form needed by your experiment; a related donor is not automatically interchangeable.",
    questions: "Provide the exact catalog entry and required quantity. Ask for batch specifications, handling information and availability confirmation before planning an experiment."
  },
  {
    slug: "human-milk-oligosaccharides", name: "Human Milk Oligosaccharides (HMOs)", nameZh: "人乳寡糖（HMO）",
    keys: ["人乳寡糖（HMO）"],
    description: "Browse research HMOs including fucosyllactose, sialyllactose and lacto-N-tetraose derivatives. Request product specifications and quotations from KASONS.",
    overview: "Human milk oligosaccharides encompass structurally diverse carbohydrates. This research catalog includes fucosylated, sialylated and neutral oligosaccharides, with separate entries for different structures and chemical forms.",
    selection: "Linkage position matters: 2'-fucosyllactose and 3-fucosyllactose are distinct, as are 3'- and 6'-sialyllactose. Check the complete name, linkage and salt form when selecting a material for analysis or method development.",
    questions: "Tell us the target structure, catalog number and amount. Request confirmation of identity, purity and documentation needed for your research workflow. Do not infer food or clinical suitability from the HMO category name."
  },
  {
    slug: "glycan-research-reagents", name: "Glycan Research Reagents", nameZh: "糖链研究试剂",
    keys: ["其他寡糖/糖链标准品", "血型抗原/肿瘤相关糖抗原", "糖鞘脂相关寡糖"],
    description: "Explore glycan research reagents, Lewis antigens and glycosphingolipid-related oligosaccharides. Enquire about identity and analytical documentation.",
    overview: "This collection brings together oligosaccharides, Lewis and blood-group carbohydrate antigens, and glycosphingolipid-related glycan structures. It provides a starting point for selecting structurally defined materials for glycobiology research.",
    selection: "Compare the full glycan name, monosaccharide sequence and linkage information. Related glycans can have the same composition while differing in connectivity; molecular formula alone does not establish identity.",
    questions: "For use as an analytical reference, request the available identity, purity and batch documentation. A catalog listing does not itself establish certified-reference-material status."
  }
] as const;

export function categoryForProduct(product: Pick<Product, "category" | "categoryKey">) {
  const key = product.categoryKey || product.category;
  return coreCategories.find((category) => (category.keys as readonly string[]).includes(key));
}

// Selected from the published catalogue on 2026-11-08. Never override CMS chemical identity/specifications.
export const priorityProducts: Record<string, { category: string; summary: string; selection: string }> = {
  "p-1786797241817": { category: "udp-sugars", summary: "UDP-Glucose is a UDP-linked glucose reagent in the KASONS research catalog.", selection: "Confirm the chemical form associated with this catalog entry before comparing it with other UDP-glucose products." },
  "p-1786797241807": { category: "udp-sugars", summary: "UDP-a-D-galactose is a nucleotide-linked galactose reagent for research enquiries.", selection: "Match the full catalog identity and anomeric designation to your protocol; distinguish it from glucose-linked donors." },
  "p-1786797241818": { category: "udp-sugars", summary: "UDP-glucuronic acid is a uronic-acid member of the UDP-sugar collection.", selection: "Check the acid or salt form and counterion when confirming the molecular weight and amount required." },
  "p-1786797241822": { category: "udp-sugars", summary: "UDP-N-acetylgalactosamine belongs to the N-acetylated amino-sugar nucleotide collection.", selection: "Distinguish the galactosamine donor from UDP-N-acetylglucosamine when specifying your order." },
  "p-1786797241823": { category: "udp-sugars", summary: "UDP-N-acetylglucosamine is an N-acetylated amino-sugar nucleotide listed for research enquiries.", selection: "Confirm the exact salt form and distinguish this glucosamine derivative from the related galactosamine donor." },
  "p-1786797241824": { category: "udp-sugars", summary: "UDP-Xylose is a pentose-containing nucleotide-sugar entry in the research catalog.", selection: "Specify this catalog number and confirm stereochemistry, chemical form and analytical documentation before ordering." },
  "p-1786797241795": { category: "gdp-sugars", summary: "GDP-Fucose is a fucose-containing guanosine diphosphate reagent in the KASONS catalog.", selection: "Check the complete chemical form; this entry should not be assumed identical to a separately listed disodium salt." },
  "p-1786797241796": { category: "gdp-sugars", summary: "GDP-L-fucose disodium salt is listed separately from other GDP-fucose chemical forms.", selection: "Include the disodium-salt designation in the enquiry and use the corresponding formula when calculating quantities." },
  "p-1786797241798": { category: "gdp-sugars", summary: "GDP-Mannose is a mannose-containing nucleotide reagent in the GDP-sugar collection.", selection: "Use the CAS number and catalog identifier together to confirm the precise chemical form required by your protocol." },
  "p-1786797241787": { category: "cmp-sialic-acids", summary: "CMP-N-acetylneuraminic acid is the CMP-linked Neu5Ac entry in this research collection.", selection: "Distinguish Neu5Ac from Neu5Gc and modified sialic acids; request confirmation of chemical form and batch specifications." },
  "p-1786797241788": { category: "cmp-sialic-acids", summary: "CMP-N-glycolylneuraminic acid is the CMP-linked Neu5Gc entry in the KASONS catalog.", selection: "The N-glycolyl group differentiates this identity from CMP-Neu5Ac. Confirm that Neu5Gc is the intended reagent." },
  "p-1786797241843": { category: "human-milk-oligosaccharides", summary: "2'-Fucosyllactose is a fucosylated oligosaccharide in the HMO research collection.", selection: "Specify the 2'-linked structure; 3-fucosyllactose is a separate catalog entry and is not an interchangeable identity." },
  "p-1786797241846": { category: "human-milk-oligosaccharides", summary: "3-Fucosyllactose is a fucosylated HMO research reagent listed separately from 2'-fucosyllactose.", selection: "Check the linkage designation and the catalog number when selecting the target oligosaccharide." },
  "p-1786797241847": { category: "human-milk-oligosaccharides", summary: "3'-Sialyllactose is a sialylated oligosaccharide in the HMO research catalog.", selection: "Distinguish the 3'-linked structure from 6'-sialyllactose and confirm whether the requested material is an acid or salt." },
  "p-1786797241849": { category: "human-milk-oligosaccharides", summary: "6'-Sialyllactose is a sialylated HMO research entry with a different linkage from 3'-sialyllactose.", selection: "Use the complete product name and CAS number, and confirm the chemical form and batch documentation." },
  "p-1786797241872": { category: "human-milk-oligosaccharides", summary: "Lacto-N-neotetraose is a neutral oligosaccharide in the KASONS HMO research collection.", selection: "Distinguish lacto-N-neotetraose from lacto-N-tetraose; similar abbreviations do not establish the same glycan identity." },
  "p-1786797241873": { category: "human-milk-oligosaccharides", summary: "Lacto-N-tetraose is a neutral HMO research reagent listed separately from lacto-N-neotetraose.", selection: "Confirm the required linkage arrangement and request identity documentation for the selected catalog entry." },
  "p-1786797241915": { category: "glycan-research-reagents", summary: "LS-tetrasaccharide a is listed in the KASONS oligosaccharide and glycan research collection.", selection: "Include the catalog number and CAS number in your enquiry to resolve naming abbreviations and confirm the intended structure." },
  "p-1786797241936": { category: "glycan-research-reagents", summary: "Lewis a trisaccharide is a carbohydrate-antigen research reagent in the glycan collection.", selection: "Specify Lewis a rather than Lewis X or other related antigens, and request structure and identity documentation." },
  "p-1786797241940": { category: "glycan-research-reagents", summary: "Sialyl Lewis X (sLeX) tetraose is a sialylated carbohydrate-antigen entry in the research catalog.", selection: "Confirm the sLeX structure rather than a related Lewis antigen, and request the analytical documentation needed by your workflow." }
};
