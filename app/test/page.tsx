import { handleClick } from "@/server/test";

const page = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <button
        onClick={handleClick}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Create Admin
      </button>
    </div>
  );
};

export default page;
