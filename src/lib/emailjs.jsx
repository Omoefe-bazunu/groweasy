import emailjs from "@emailjs/browser";

// Initialize EmailJS with public key Emailjs account
emailjs.init("U_hf52yBmuYu1Fjig");
export const sendAdminNotification = async (
  userName,
  userEmail,
  plan,
  screenshotUrl
) => {
  const adminEmail = "raniem57@gmail.com"; // Hardcoded admin email

  // Validate admin email
  if (!adminEmail || !adminEmail.includes("@")) {
    throw new Error("Admin email is missing or invalid.");
  }

  const templateParams = {
    user_name: userName,
    user_email: userEmail,
    plan: plan,
    screenshot_url: screenshotUrl,
    to_email: adminEmail,
  };

  try {
    const response = await emailjs.send(
      "service_mo5cjra", // Emailjs service ID
      "template_t9g6gbi", // EmailJS template ID
      templateParams
    );
    console.log("Admin notification sent successfully:", response);
    return "Admin notification sent successfully.";
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    throw new Error(
      "Failed to send admin notification: " + error.text || error.message
    );
  }
};
