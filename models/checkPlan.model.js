import { model, Schema } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const CheckPlanSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_members'
    },
    planMappingId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_plans_mappings'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
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

CheckPlanSchema.plugin(aggregatePaginate);

const CheckPlan = model('tbl_check_plan', CheckPlanSchema);
export default CheckPlan;
