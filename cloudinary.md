# Cloudinary Guide (Production-Grade)

We'll implement the **best practice**:  
**Frontend direct upload (signed) + Backend signature & delete control**

This gives you:
- Maximum security (API secret never leaves server)
- Fast uploads
- Auto cleanup of old images
- Organized folders
- Full control over deletes

#### Step 1: Cloudinary Setup (Do This Now)

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Settings → Upload → Upload presets → **Add upload preset**
   - Name: `professionalsbd_signed`
   - Signing mode: **Signed**
   - Folder: `professionals-bd`
   - Allowed formats: `jpg,png,webp,gif,pdf,doc,docx`
   - Save

#### Step 2: Backend – Cloudinary Utils & Routes

Create folder: `src/features/media/`

**File: `src/utils/cloudinary.utils.ts`**

```typescript
// src/utils/cloudinary.utils.ts
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import logger from "./logger.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const getPublicIdFromUrl = (url: string | null): string | null => {
  if (!url) return null;

  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1];
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, ""); // Remove version like v1234567890/
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");
    return withoutExtension;
  } catch {
    return null;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image", // Change to "raw" for PDFs if needed
    });

    if (result.result === "ok" || result.result === "not found") {
      logger.info(`Deleted Cloudinary asset: ${publicId}`);
    } else {
      logger.warn(`Cloudinary delete failed: ${publicId}`, result);
    }
  } catch (error) {
    logger.error(`Cloudinary delete error: ${publicId}`, error);
    // Don't throw — cleanup should not break main operation
  }
};
```

**File: `src/features/media/media.controller.ts`**

```typescript
// src/features/media/media.controller.ts
import { Request, Response, NextFunction } from "express";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { authenticate } from "../../middleware/auth.middleware.js";

export class MediaController {
  // Called by frontend to get signed params
  static getUploadSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = "professionals-bd"; // Fixed folder from preset

      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder,
          upload_preset: "professionalsbd_signed",
        },
        env.CLOUDINARY_API_SECRET!
      );

      res.json(
        ApiResponse.success({
          timestamp,
          signature,
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          apiKey: env.CLOUDINARY_API_KEY,
          folder,
          uploadPreset: "professionalsbd_signed",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Optional: Delete specific asset (call from frontend when removing avatar/certification)
  static async deleteAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json({ success: false, message: "publicId required" });
      }

      await cloudinary.uploader.destroy(publicId, { invalidate: true });

      res.json(ApiResponse.success(null, "Asset deleted"));
    } catch (error) {
      next(error);
    }
  }
}
```

**File: `src/features/media/media.routes.ts`**

```typescript
// src/features/media/media.routes.ts
import { Router } from "express";
import { MediaController } from "./media.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/signature", authenticate, MediaController.getUploadSignature);
router.post("/delete", authenticate, MediaController.deleteAsset);

export const mediaRoutes = router;
```

**Add to app.ts**

```ts
import { mediaRoutes } from "./features/media/media.routes.js";

app.use("/api/v1/media", mediaRoutes);
```

#### Step 3: Frontend Upload (Next.js Example)

```tsx
// utils/upload.ts or in component
const uploadToCloudinary = async (file: File, type: "avatar" | "certification") => {
  // 1. Get signature
  const res = await fetch("/api/v1/media/signature", {
    headers: { Authorization: `Bearer ${yourJwtToken}` },
  });

  if (!res.ok) throw new Error("Failed to get signature");

  const { timestamp, signature, cloudName, apiKey, folder, uploadPreset } = await res.json();

  // 2. Upload directly
  const formData = new FormData();
  formData.append("file", file);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("api_key", apiKey);
  formData.append("folder", folder);
  formData.append("upload_preset", uploadPreset);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(data.error?.message || "Upload failed");

  return data.secure_url;
};
```

Usage in component:

```tsx
const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const url = await uploadToCloudinary(file, "avatar");
    // Send to backend to update user
    await fetch("/api/v1/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatar: url }),
    });
    // Success → refresh user data
  } catch (err) {
    alert("Upload failed");
  }
};
```

#### Step 4: Auto Cleanup Old Images (In Your Update Controllers)

```ts
// Example in User/Profile update controller
const oldAvatar = currentUser.avatar;
if (oldAvatar && oldAvatar !== newAvatarUrl) {
  const publicId = getPublicIdFromUrl(oldAvatar);
  if (publicId) await deleteFromCloudinary(publicId);
}
```

### Summary

You now have:

- Fixed Prisma import error → rename to `client.ts`
- Fully secure Cloudinary uploads (frontend direct, signed)
- Automatic old image deletion
- Clean folder structure (`professionals-bd/`)
- Delete endpoint for manual cleanup
- Production-ready, scalable, cost-efficient

This is **exactly** how modern apps (Vercel, Lemon Squeezy, Dub.co) handle media.

Ready for the **Professional Profile full CRUD** with avatar + certifications + auto cleanup? Say **"yes"** and I'll build it complete! You're so close to a world-class backend.