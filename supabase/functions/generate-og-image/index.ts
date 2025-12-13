import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "school";
    const name = url.searchParams.get("name") || "School";
    const location = url.searchParams.get("location") || "";

    console.log(`Generating OG image for ${type}: ${name} (${location})`);

    // Truncate name if too long
    const displayName = name.length > 50 ? name.substring(0, 47) + "..." : name;
    
    // Calculate font size based on name length
    const nameFontSize = displayName.length > 35 ? 42 : displayName.length > 25 ? 48 : 56;

    // Type-specific styling
    let typeLabel = "School";
    let typeIcon = "🏫";
    if (type === "district") {
      typeLabel = "School District";
      typeIcon = "🏛️";
    } else if (type === "state") {
      typeLabel = "State";
      typeIcon = "📍";
    }

    const response = new ImageResponse(
      {
        type: "div",
        props: {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px",
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            fontFamily: "Arial, Helvetica, sans-serif",
          },
          children: [
            // Top section with badge
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                },
                children: [
                  // Type badge
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.15)",
                        borderRadius: "25px",
                        padding: "12px 24px",
                        alignSelf: "flex-start",
                      },
                      children: [
                        {
                          type: "span",
                          props: {
                            style: {
                              fontSize: "24px",
                              color: "white",
                            },
                            children: `${typeIcon} ${typeLabel} Fundraising`,
                          },
                        },
                      ],
                    },
                  },
                  // Main name
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: `${nameFontSize}px`,
                        fontWeight: "bold",
                        color: "white",
                        lineHeight: 1.2,
                        marginTop: "40px",
                      },
                      children: displayName,
                    },
                  },
                  // Location
                  location ? {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "32px",
                        color: "rgba(255,255,255,0.8)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      },
                      children: `📍 ${location}`,
                    },
                  } : null,
                ].filter(Boolean),
              },
            },
            // Bottom section
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                },
                children: [
                  // Value prop badge
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
                        borderRadius: "8px",
                        padding: "16px 24px",
                        alignSelf: "flex-start",
                      },
                      children: [
                        {
                          type: "span",
                          props: {
                            style: {
                              fontSize: "24px",
                              fontWeight: "600",
                              color: "white",
                            },
                            children: "✓ 100% of Donations to Programs",
                          },
                        },
                      ],
                    },
                  },
                  // Sponsorly branding
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      },
                      children: [
                        {
                          type: "span",
                          props: {
                            style: {
                              fontSize: "36px",
                              fontWeight: "bold",
                              color: "white",
                            },
                            children: "Sponsorly",
                          },
                        },
                        {
                          type: "span",
                          props: {
                            style: {
                              fontSize: "24px",
                              color: "rgba(255,255,255,0.7)",
                            },
                            children: "Modern Fundraising for Schools",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
      }
    );

    // Add CORS and caching headers to the response
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800");

    console.log("OG image generated successfully");

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
