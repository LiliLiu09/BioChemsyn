export type Product = {
  id: string;
  sku: string;
  cas: string;
  nameCn: string;
  nameEn: string;
  category: string;
  formula: string;
  purity: string;
  stock: number;
  packageSize: string;
  price: number;
  leadTime: string;
  tags: string[];
};

export const products: Product[] = [
  {
    id: "p-1001",
    sku: "CY-100492",
    cas: "98-92-0",
    nameCn: "烟酰胺",
    nameEn: "Nicotinamide",
    category: "生化试剂",
    formula: "C6H6N2O",
    purity: "99%",
    stock: 184,
    packageSize: "25g",
    price: 88,
    leadTime: "现货",
    tags: ["维生素", "现货", "热销"]
  },
  {
    id: "p-1002",
    sku: "CY-415725",
    cas: "69-65-8",
    nameCn: "D-甘露醇",
    nameEn: "D-Mannitol",
    category: "标准品",
    formula: "C6H14O6",
    purity: "98%",
    stock: 72,
    packageSize: "100g",
    price: 156,
    leadTime: "现货",
    tags: ["糖醇", "标准品"]
  },
  {
    id: "p-1003",
    sku: "CY-407214",
    cas: "77-06-5",
    nameCn: "赤霉酸",
    nameEn: "Gibberellic Acid",
    category: "植物激素",
    formula: "C19H22O6",
    purity: "90%",
    stock: 18,
    packageSize: "1g",
    price: 420,
    leadTime: "1-2 天",
    tags: ["植物", "小包装"]
  },
  {
    id: "p-1004",
    sku: "CY-900055",
    cas: "25322-68-3",
    nameCn: "聚乙二醇 2000",
    nameEn: "Polyethylene Glycol 2000",
    category: "PEG",
    formula: "HO(C2H4O)nH",
    purity: "AR",
    stock: 39,
    packageSize: "500g",
    price: 260,
    leadTime: "现货",
    tags: ["PEG", "大包装"]
  },
  {
    id: "p-1005",
    sku: "CY-500116",
    cas: "360-65-6",
    nameCn: "甘氨去氧胆酸",
    nameEn: "Glycodeoxycholic Acid",
    category: "脂类标品",
    formula: "C26H43NO5",
    purity: "97%",
    stock: 0,
    packageSize: "10mg",
    price: 1180,
    leadTime: "询期",
    tags: ["胆汁酸", "进口替代"]
  },
  {
    id: "p-1006",
    sku: "CY-319303",
    cas: "138-59-0",
    nameCn: "莽草酸",
    nameEn: "Shikimic Acid",
    category: "中草药提取物",
    formula: "C7H10O5",
    purity: "98%",
    stock: 96,
    packageSize: "5g",
    price: 320,
    leadTime: "现货",
    tags: ["天然产物", "高纯"]
  }
];

export const categories = Array.from(new Set(products.map((product) => product.category)));
