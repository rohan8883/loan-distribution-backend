import { model, Schema } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const MemberSchema = new Schema(
  {
    generatedId: {
      type: String
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users' // Refers to Users model
    },
    memberName: {
      type: String,
      required: true
    },
    address: {
      type: String
    },
    mobile: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    weight: {
      type: Number
    },
    email: {
      type: String
    },
    dob: {
      type: Date,
      required: true
    },
    imageUrl: {
      type: String
    },
    fullImgUrl: {
      type: String
    },
    // planMappingId: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: 'tbl_plans_mappings',
    //     path: '_id'
    //   }
    // ],
    createdById: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        path: '_id'
      }
    ,
    status: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

MemberSchema.plugin(aggregatePaginate);

const Member = model('tbl_members', MemberSchema);
export default Member;
