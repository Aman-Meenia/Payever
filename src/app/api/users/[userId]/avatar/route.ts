import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import User from "@/models/userModel";
import dbConnect from "@/db/dbConnect";
import axios from "axios";
import crypto from "crypto";
import path from "path";
import fs from "fs-extra";
import { ResponseType } from "@/types/ResponseType";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const userId = pathname.split("/")[3];

    console.log("HELLLO ", userId);
    if (!userId) {
      const errResponse: ResponseType = {
        success: false,
        statusCode: 400,
        message: "User ID is required",
      };
      return NextResponse.json(errResponse);
    }

    await dbConnect();
    const user = await User.findOne({ userId: userId });

    if (user && user?.avatar) {
      const imagePath = path.join(
        process.cwd(),
        "public",
        "avatars",
        user.avatar,
      );
      if (await fs.pathExists(imagePath)) {
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString("base64");
        const successResponse: ResponseType = {
          success: true,
          statusCode: 200,
          message: "Avatar fetched successfully",
          messages: [{ image: base64Image }],
        };
        return NextResponse.json(successResponse);
      }
    }

    console.log("FETCH DATA");
    const response = await axios
      .get(`https://reqres.in/api/users/${userId}`)
      .then((response) => {
        console.log(response.data);
        return response.data;
      })
      .catch((err) => {
        console.log(err.response.data);
        return err.response.data;
      });
    if (response.data === undefined) {
      const errResponse: ResponseType = {
        success: false,
        statusCode: 400,
        message: "User not found",
      };
      return NextResponse.json(errResponse);
    }
    console.log("RES", response);
    const avatarUrl = response.data.avatar;
    const avatarResponse = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
    });
    const avatarBuffer = Buffer.from(avatarResponse.data, "binary");

    const hash = crypto.createHash("md5").update(avatarBuffer).digest("hex");
    const imagePath = path.join(process.cwd(), "public", "avatars", hash);

    await fs.ensureDir(path.dirname(imagePath));
    await fs.writeFile(imagePath, avatarBuffer);

    if (user) {
      user.avatar = hash;
      await user.save();
    } else {
      await User.create({
        userId: userId,
        avatar: hash,
        username: response.data?.first_name + " " + response.data?.last_name,
        email: response.data?.email,
        password: "123123123",
      });
    }

    const base64Image = avatarBuffer.toString("base64");
    const successResponse: ResponseType = {
      success: true,
      statusCode: 200,
      message: "Avatar fetched and saved successfully",
      messages: [{ image: base64Image }],
    };
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error(error);
    const errResponse: ResponseType = {
      success: false,
      statusCode: 500,
      message: "Internal server error",
    };
    return NextResponse.json(errResponse);
  }
}

// DELETE Request
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const userId = pathname.split("/")[3];
    if (!userId) {
      const errResponse: ResponseType = {
        success: false,
        statusCode: 400,
        message: "User ID is required",
      };
      return NextResponse.json(errResponse);
    }

    await dbConnect();
    const user = await User.findOne({ userId: userId });

    if (user && user.avatar) {
      const imagePath = path.join(
        process.cwd(),
        "public",
        "avatars",
        user.avatar,
      );
      if (await fs.pathExists(imagePath)) {
        await fs.unlink(imagePath);
      }
      user.avatar = "";
      await User.findByIdAndDelete(user._id);

      const successResponse: ResponseType = {
        success: true,
        statusCode: 200,
        message: "Avatar and User deleted successfully",
      };
      return NextResponse.json(successResponse);
    } else {
      const errResponse: ResponseType = {
        success: false,
        statusCode: 404,
        message: "Avatar not found",
      };
      return NextResponse.json(errResponse);
    }
  } catch (error) {
    console.error(error);
    const errResponse: ResponseType = {
      success: false,
      statusCode: 500,
      message: "Internal server error",
    };
    return NextResponse.json(errResponse);
  }
}
