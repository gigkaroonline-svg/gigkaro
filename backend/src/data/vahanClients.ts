/** Official Vahan city and company names. Casing must match the partner guide. */

export const VAHAN_COMPANIES = [
  "Amazon Flex",
  "Big Basket",
  "Blinkit",
  "Blinkit Picker Packer",
  "Delhivery",
  "Everest Fleet",
  "Flipkart Minutes",
  "GoBolt",
  "Loadshare",
  "Milo",
  "Moove",
  "PhonePe",
  "Porter",
  "Porter 3W",
  "Pronto",
  "Rapido Auto",
  "Rapido Bike",
  "Rapido E-rickshaw",
  "Snabbit",
  "Swiggy",
  "Swiggy Instamart",
  "Swiggy SOC",
  "Uber",
  "Uber 3W",
  "Xpress Bees",
  "Zippee",
] as const;

export const VAHAN_CITIES = [
  "Abohar", "Agartala", "Agra", "Ahmedabad", "Aizawl", "Ajmer", "Alappuzha", "Aligarh",
  "Allahabad", "Alwar", "Ambala", "Ambikapur", "Ambur", "Amritsar", "Anand", "Anantapur",
  "Ankleshwar", "Arrah", "Asansol", "Attingal", "Aurangabad", "Aurangabad_Bihar", "Bagalkot",
  "Bahadurgarh", "Balaghat", "Balangir", "Balasore", "Banka", "Bankura", "Bapatla",
  "Bapatla&Chirala", "Bardoli", "Bareilly", "Barh", "Barnala", "Bathinda", "Begusarai",
  "Belgaum", "Bellary", "Bengaluru", "Berhampur", "Bhadrachalam", "Bhadrak", "Bhagalpur",
  "Bharatpur", "Bharuch", "Bhavnagar", "Bhilai", "Bhilwara", "Bhimavaram", "Bhiwadi",
  "Bhiwani", "Bhojpur", "Bhopal", "Bhubaneswar", "Bhuj", "Bhusawal", "Bidar", "Bihta",
  "Bijapur", "Bikaner", "Bilaspur", "Bokaro", "Burdwan", "Buxar", "Calcutta", "Chandigarh",
  "Charkhi Dadri", "Chennai", "Chhapra", "Chikmagalur", "Chikodi", "Chirala", "Chitradurga",
  "Chittoor", "Coimbatore", "Contai", "Cooch", "Cuddalore", "Cuttack", "Darbhanga",
  "Darjeeling", "Davanagere", "Dehradun", "Delhi", "Dhanbad", "Dharamshala", "Dharwad",
  "Dibrugarh", "Dimapur", "Dindigul", "Durgapur", "Eluru", "Erode", "Faridabad", "Firozpur",
  "Gadag", "Gandhidham", "Gaya", "Ghaziabad", "Goa", "Goa-Panaji", "Golaghat", "Gopalganj",
  "Gorakhpur", "Gulbarga", "Guntur", "Gurgaon", "Guwahati", "Gwalior", "Haldwani",
  "Hampi-Hospet", "Haridwar", "Hassan", "Haveri", "Hisar", "Hissar", "Hooghly", "Hosur",
  "Howrah", "Hyderabad", "Imphal", "Indore", "Jabalpur", "Jagatsinghapur", "Jagdalpur",
  "Jaipur", "Jalandhar", "Jalgaon", "Jalpaiguri", "Jammu", "Jamshedpur", "Jhansi",
  "Jharsuguda", "Jind", "Jodhpur", "Jorhat", "Kadapa", "Kakinada", "Kanchipuram", "Kannur",
  "Kanpur", "Karimnagar", "Karwar", "Kendrapara", "Khammam", "Kochi", "Kodagu", "Kodaikanal",
  "Kohima", "Kolar", "Kolhapur", "Kollam", "Korba", "Kota", "Kothagudem", "Kottayam",
  "Kozhikode", "Kumbakonam", "Kurnool", "Kurukshetra", "Lucknow", "Ludhiana", "Machilipatnam",
  "Madanapalle", "Madhubani", "Madurai", "Mahbubnagar", "Malda", "Mancherial", "Mandya",
  "Mangalore", "Masaurhi", "Mathura", "Mayurbhanj", "Meerut", "Midnapore", "Mirzapur",
  "Modasa", "Mohali", "Moradabad", "Morbi", "Motihari", "Mumbai", "Munger", "Muzaffarpur",
  "Mysore", "Nadiad", "Nagercoil", "Nagpur", "Nalanda", "Nandyal", "Nanjangud", "Nashik",
  "Nawada", "Nellore", "New Delhi", "Nizamabad", "Noida", "Ongole", "Ooty", "Palwal",
  "Panchkula", "Panipat", "Patiala", "Patna", "Pondicherry", "Porbandar", "Pune", "Puri",
  "Purnea", "Purulia", "Puttur", "Raichur", "Raigarh", "Raipur", "Rajahmundry", "Rajkot",
  "Rajnandgaon", "Rajpura", "Ranaghat", "Ranchi", "Rewa", "Rewari", "Rishikesh", "Rohtak",
  "Rourkela", "Saharsa", "Salem", "Samastipur", "Sambalpur", "Sangrur", "Satara", "Satna",
  "Shahjahanpur", "Shillong", "Shimla", "Shimoga", "Siddipet", "Sikar", "Sikkim", "Silchar",
  "Siliguri", "Sirsa", "Sirsi", "Sivakasi", "Sivasagar", "Siwan", "Sonipat", "Sri Ganganagar",
  "Srikakulam", "Srinagar", "Surat", "Tadepalligudem", "Tanuku", "Tarn Taran", "Tezpur",
  "Thanjavur", "Thiruvalla", "Thiruvananthapuram", "Thrissur", "Tiruchy", "Tirunelveli",
  "Tirupati", "Tirupur", "Trichy", "Trivandrum", "Tumkur", "Tuni", "Udaipur", "Udupi",
  "Ujjain", "Vadodara", "Valsad", "Vapi", "Varanasi", "Vellore", "Vijayapura", "Vijayawada",
  "Visakhapatnam", "Vizianagaram", "Warangal", "Wardha", "Wayanad", "West Dinajpur",
  "Yamuna Nagar",
] as const;

const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  bombay: "Mumbai",
  mumbai: "Mumbai",
  gurugram: "Gurgaon",
  gurgaon: "Gurgaon",
  kolkata: "Calcutta",
  calcutta: "Calcutta",
  mysuru: "Mysore",
  mysore: "Mysore",
  "delhi ncr": "Delhi",
  "new delhi": "New Delhi",
  trivandrum: "Trivandrum",
  thiruvananthapuram: "Thiruvananthapuram",
};

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function spaced(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function vahanClientName(...candidates: Array<string | undefined | null>) {
  const byCompact = new Map(VAHAN_COMPANIES.map((name) => [compact(name), name]));
  for (const candidate of candidates) {
    const raw = String(candidate || "").trim();
    if (!raw) continue;
    const official = byCompact.get(compact(raw));
    if (official) return official;
  }
  return null;
}

export function vahanCityName(city: string | undefined | null) {
  const raw = String(city || "").trim();
  if (!raw) return null;
  const alias = CITY_ALIASES[spaced(raw)];
  if (alias) return alias;
  const official = VAHAN_CITIES.find((name) => name.toLowerCase() === raw.toLowerCase());
  return official || null;
}

export function normalizeIndianMobile(raw: string | undefined | null) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
