import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: {
                public_id: String,
                url: String //cloudinary url
              },
              required: true,
        },
        thumbnail: {
            type: {
                public_id: String,
                url: String //cloudinary url
              },
              required: true,
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number, //cloudinary duration
            required: true
        },
        views: {
            type: Number,
            defaultValue: 0
        },
        isPublished: {
            type: Boolean,
            defaultValue: false
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)