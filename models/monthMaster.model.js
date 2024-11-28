import { model, Schema } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const monthMasterSchema = new Schema(
  {
    monthName: {
      type: String,
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

monthMasterSchema.plugin(aggregatePaginate);

const MonthMaster = model('tbl_month_mstrs', monthMasterSchema);
export default MonthMaster;
