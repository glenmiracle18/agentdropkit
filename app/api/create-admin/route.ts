import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const adminEmail = "bonyuglen@gmail.com";
    const adminName = "Glen";
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      // Update existing user to admin
      if (existingUser.role === 'admin') {
        return NextResponse.json({
          message: `✅ User ${existingUser.email} is already an admin.`,
          user: existingUser
        });
      }
      
      const updatedUser = await db.user.update({
        where: { email: adminEmail },
        data: { role: 'admin' }
      });
      
      return NextResponse.json({
        message: `✅ Successfully updated ${updatedUser.email} to admin!`,
        user: updatedUser
      });
    }

    // Create new admin user
    const newUser = await db.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        role: 'admin',
        emailVerified: true,
      }
    });

    return NextResponse.json({
      message: `✅ Successfully created admin user: ${newUser.email}`,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user", details: error },
      { status: 500 }
    );
  }
}