import { model, Schema } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const PlanMaster = new Schema(
  {
    planName: {
      type: String,
      required: true
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      path: '_id'
    },
    status: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

PlanMaster.plugin(aggregatePaginate);

const PlansMaster = model('tbl_plans_mstrs', PlanMaster);
export default PlansMaster;
