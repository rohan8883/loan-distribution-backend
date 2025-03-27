import { model, Schema } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const PlansMappingSchema = new Schema(
  {
    planMappingName: {
      type: String
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_plans_mstrs',
      required: true
    },
    monthId: {
      type: Schema.Types.ObjectId,
      ref: 'tbl_month_mstrs',
      required: true
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      path: '_id'
    },
    amount: {
      type: Number,
      required: true
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

PlansMappingSchema.plugin(aggregatePaginate);

const PlansMapping = model('tbl_plans_mappings', PlansMappingSchema);
export default PlansMapping;
