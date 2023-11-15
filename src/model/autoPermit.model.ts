import mongoose, { Schema } from "mongoose";

export interface autoPermitDocument extends mongoose.Document {
  id: string;
  mode: string;
}

const autoPermitSchema = new Schema({
  id: { type: String, required: true, default: "1" },
  mode: { type: String, required: true, enum: ["auto", "manual", "dead"] },
});

const autoPermitModel = mongoose.model<autoPermitDocument>(
  "autoPermit",
  autoPermitSchema
);

export default autoPermitModel;
