document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("foodForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const organization = document.getElementById("organization").value;
    const event = document.getElementById("event").value;
    const campus = document.getElementById("campus").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value;
    const photoInput = document.getElementById("photo");
    const user = localStorage.getItem("loggedUser");

    let photoURL = "";
    if (photoInput.files.length > 0) {
      photoURL = URL.createObjectURL(photoInput.files[0]);
    }

    const newPost = {
      id: Date.now(),
      organization,
      event,
      campus,
      location,
      description,
      photoURL,
      user,
      timestamp: new Date().toISOString()  // ✅ Added for notification logic
    };

    const existingPosts = JSON.parse(localStorage.getItem("foodPosts")) || [];
    existingPosts.push(newPost);
    localStorage.setItem("foodPosts", JSON.stringify(existingPosts));

    alert("Food post submitted!");
    window.location.href = "view.html";
  });
});
