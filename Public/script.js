// Toolbar buttons animation

const toolbarButtons = document.querySelectorAll(".toolbar-btn");

toolbarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.style.transform = "scale(0.96)";

    setTimeout(() => {
      button.style.transform = "scale(1)";
    }, 150);
  });
});

// Task row hover interaction

const taskRows = document.querySelectorAll(".task-row");

taskRows.forEach((row) => {
  row.addEventListener("mouseenter", () => {
    row.style.transform = "translateY(-2px)";
  });

  row.addEventListener("mouseleave", () => {
    row.style.transform = "translateY(0)";
  });
});
