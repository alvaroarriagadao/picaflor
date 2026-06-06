import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c0a09",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Diamond shape — the Picaflor mark */}
        <div
          style={{
            width: 108,
            height: 108,
            background: "#e8632c",
            transform: "rotate(45deg)",
            borderRadius: 14,
          }}
        />
      </div>
    ),
    size
  );
}
