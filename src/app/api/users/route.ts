import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import User from "@/models/userModel";
import dbConnect from "@/db/dbConnect";
import { fromZodError } from "zod-validation-error";
import axios from "axios";
import { ResponseType } from "@/types/ResponseType";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { sendEmailToUser } from "@/utils/mail";

const intputTypeValidation = z
  .object({
    username: z.string(),
    email: z.string(),
    password: z.string(),
    avatar: z.string(),
  })
  .strict();

type inputType = z.infer<typeof intputTypeValidation>;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body: inputType = await req.json();

    const zodResponse = intputTypeValidation.safeParse(body);

    if (!zodResponse.success) {
      const errResponse: ResponseType = {
        success: false,
        statusCode: 400,
        message: fromZodError(zodResponse?.error).message,
      };
      return NextResponse.json(errResponse);
    }

    // check user with same name or email present

    let userFind = await User.findOne({ username: body.username });

    if (userFind) {
      const errResponse: ResponseType = {
        success: false,
        statusCode: 400,
        message: "User with this username already exists",
      };
      return NextResponse.json(errResponse);
    }

    userFind = await User.findOne({ email: body.email });

    if (userFind) {
      const errResponse: ResponseType = {
        success: false,
        statusCode: 400,
        message: "User with this email already exists",
      };
      return NextResponse.json(errResponse);
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const uniqueId = uuidv4();
    const user = new User({
      username: body.username,
      email: body.email,
      password: hashedPassword,
      avatar: body.avatar,
      userId: uniqueId,
    });
    console.log(user);

    await user.save();
    await sendEmailToUser(body.email, body.username);
    const successResponse: ResponseType = {
      success: true,
      statusCode: 200,
      message: "User created successfully",
      messages: [
        {
          userId: user.userId,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      ],
    };
    return NextResponse.json(successResponse);
  } catch (err) {
    console.log(err);
    const errResponse: ResponseType = {
      success: false,
      statusCode: 500,
      message: "Internal server error",
    };
    return NextResponse.json(errResponse);
  }
}

// Get Request

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    console.log("I am working");
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
    const successResponse: ResponseType = {
      success: true,
      statusCode: 200,
      message: "User details fetched successfully",
      messages: response,
    };
    return NextResponse.json(successResponse);
  } catch (err) {
    const errResponse: ResponseType = {
      success: false,
      statusCode: 500,
      message: "Internal server error",
    };
    return NextResponse.json(errResponse);
  }
}
