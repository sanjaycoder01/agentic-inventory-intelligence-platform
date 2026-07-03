import { familyPersona } from "./family.persona.js";
import { frequentBuyerPersona } from "./frequentBuyer.persona.js";
import { impulseBuyerPersona } from "./impulseBuyer.persona.js";
import { officeEmployeePersona } from "./office.persona.js";
import type { CustomerPersona } from "../behavior.types.js";
import type { PersonaId } from "../../scenarios/scenario.types.js";
import { studentPersona } from "./student.persona.js";
import { windowShopperPersona } from "./windowShopper.persona.js";

export const personas: Record<PersonaId, CustomerPersona> = {
  STUDENT: studentPersona,
  FAMILY: familyPersona,
  OFFICE_EMPLOYEE: officeEmployeePersona,
  FREQUENT_BUYER: frequentBuyerPersona,
  WINDOW_SHOPPER: windowShopperPersona,
  IMPULSE_BUYER: impulseBuyerPersona,
};

export function getPersona(id: PersonaId): CustomerPersona {
  return personas[id];
}

export function listPersonas(): CustomerPersona[] {
  return Object.values(personas);
}
