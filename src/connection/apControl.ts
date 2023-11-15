import { autoPermitGet } from "../service/autoPermit.service";
import { addDetailSaleByAp } from "../service/detailSale.service";
import { getDevice } from "../service/device.service";
import { drop, get, mqttEmitter, set } from "../utils/helper";

export const apController = async (depNo: string, nozzleNo: string) => {
  try {
    let mode = await get("mode");
    let approved = await get(nozzleNo);

    if (!mode) {
      let result = await autoPermitGet();
      await set("mode", result?.mode);
    }

    if (mode == "allow" && !approved) {
      addDetailSaleByAp(depNo , nozzleNo)
      mqttEmitter(`detpos/local_server/${depNo}`, nozzleNo + "appro");
      set(nozzleNo, "approved");
    }
  } catch (e) {
    throw Error(e);
  }
};

export const apPPController = async (depNo: string, nozzleNo: string) => {
  let approved = await get(nozzleNo);
  console.log(nozzleNo)
  console.log(approved)
  if (approved) await drop(nozzleNo);
};

export const apFinalDropController = async (
  depNo: string,
  message: string
) => {
  try {
    // console.log(message)

    const regex = /[A-Z]/g;
    let data: any[] = message.split(regex);

    let devType = await get("dep_" + depNo.trim());
    let approved = await get(data[0]+"permit");
    // console.log(approved )
    if (!devType) {
      let device = await getDevice({ dep_no: depNo });
      await set(`dep_${depNo}`, device[0].dep_type);
      devType = await get(`dep_${depNo}`);
    }

    // console.log(devType)

    if (devType == "tatsuno" && approved) {
      // console.log("here")
      await drop(data[0] + "permit");
    }
  } catch (e) {
    throw Error(e);
  }
};
