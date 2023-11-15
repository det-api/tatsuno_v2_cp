import fs from "fs";
import { addRole, getRole, roleAddPermit } from "../service/role.service";
import { addPermit, getPermit } from "../service/permit.service";
import { roleDocument } from "../model/role.model";
import { permitDocument } from "../model/permit.model";

export const rp = async () => {
  let data: any = fs.readFileSync("./src/migrations/rolePermit.json");
  let rp = JSON.parse(data);
  rp.roles.forEach(async (ea: roleDocument) => {
    try {
      let result = await addRole(ea);
    } catch (e: any) {}
  });
  rp.permits.forEach(async (ea: permitDocument) => {
    try {
      let result = await addPermit(ea);
      console.log(result);
    } catch (e: any) {}
  });
  managerRoleAddPermit();
  cashierRoleAddPermit();
};

export const managerRoleAddPermit = async () => {
  let magRole = await getRole({ name: "manager" });

  if (magRole[0].permits.length > 0) {
    return;
  }

  let permit = await getPermit({});

  if (!magRole[0]) {
    return "manager not defind";
  }

  permit.forEach(async (ea) => {
    await roleAddPermit(magRole[0]._id, ea._id);
  });
};

export const cashierRoleAddPermit = async () => {
  let cshRole = await getRole({ name: "cashier" });

  if (cshRole[0].permits.length > 0) {
    return;
  }
  let permit = await getPermit({});

  permit.forEach(async (ea) => {

    if (ea.name == "delete" || ea.name == "edit") {
      return;
    }
    await roleAddPermit(cshRole[0]._id, ea._id);
  });
};