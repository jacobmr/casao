import { NextResponse } from "next/server";
import { getCachedToken } from "../../../lib/token-service-kv";
import { getCachedPricing, setCachedPricing } from "../../../lib/kv-cache";

export async function POST(request) {
  try {
    const body = await request.json();
    const { checkIn, checkOut, guests = 2, coupon } = body;
    const listingId = process.env.GUESTY_PROPERTY_ID;

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "checkIn and checkOut are required" },
        { status: 400 },
      );
    }

    // Don't cache if coupon is provided (need fresh pricing with discount)
    if (!coupon) {
      const cached = await getCachedPricing(checkIn, checkOut, guests);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    console.log(
      `💰 Fetching quote for ${checkIn} to ${checkOut}, ${guests} guests${coupon ? ` with coupon: ${coupon}` : ""}`,
    );

    const token = await getCachedToken();

    // Use Guesty's quotes endpoint
    const url = "https://booking.guesty.com/api/reservations/quotes";

    const requestBody = {
      listingId,
      checkInDateLocalized: checkIn,
      checkOutDateLocalized: checkOut,
      adults: guests,
      children: 0,
      currency: "USD",
    };

    // Add coupon if provided
    if (coupon && coupon.trim()) {
      requestBody.coupons = coupon.trim().toUpperCase();
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Guesty quotes API error:", error);

      // Send Pushover notification for API failures
      try {
        const pushoverUserKey = process.env.PUSHOVER_USER_KEY;
        const pushoverApiToken = process.env.PUSHOVER_API_TOKEN;

        if (pushoverUserKey && pushoverApiToken) {
          // Parse error to check for specific issues
          let errorDetail = error;
          let isHardBlocked = false;

          try {
            const errorJson = JSON.parse(error);
            if (errorJson.error?.code === "LISTING_IS_NOT_AVAILABLE") {
              const notApplicable =
                errorJson.error?.data?.moreDetails?.notApplicableRatePlans?.[0]
                  ?.notApplicable;
              isHardBlocked = notApplicable?.hardBlocked === true;
              errorDetail = `${errorJson.error.code}: ${errorJson.error.message}`;
            }
          } catch (e) {
            // Error parsing failed, use raw error
          }

          const message = `Guesty Quotes API Failed\n\nDates: ${checkIn} → ${checkOut}\nGuests: ${guests}\n\nError: ${errorDetail}\n\n${isHardBlocked ? "⚠️ Property shows as HARD BLOCKED in Guesty. Check calendar for conflicts or allotment settings." : "Check Guesty API configuration."}`;

          const formData = new URLSearchParams({
            token: pushoverApiToken,
            user: pushoverUserKey,
            title: "🚨 Guesty API Error",
            message: message,
            priority: "1", // High priority
          });

          await fetch("https://api.pushover.net/1/messages.json", {
            method: "POST",
            body: formData,
          });

          console.log("📱 Pushover notification sent for API error");
        }
      } catch (notifError) {
        console.error("Failed to send notification:", notifError);
        // Don't fail the request if notification fails
      }

      return NextResponse.json(
        { error: `Guesty API error: ${error}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Log the full structure to debug pricing
    console.log("✅ Quote received - Full response:");
    console.log(JSON.stringify(data, null, 2));

    // Log specific pricing paths
    console.log("📊 Pricing breakdown:");
    console.log(
      "  - rates.ratePlans[0].money:",
      data.rates?.ratePlans?.[0]?.money,
    );
    console.log("  - money (top level):", data.money);

    // Cache the result
    await setCachedPricing(checkIn, checkOut, guests, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Quotes API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quote" },
      { status: 500 },
    );
  }
}
