const buttonScrollTo = document.querySelectorAll(".realtors__img");
const homes = document.querySelector(".homes");

//Add event listenter to common parent element
document.querySelector(".realtors__list").addEventListener("click", (e) => {
  e.preventDefault();
  console.log(" document.querySelector", document.querySelector("#section--1"));
  document.querySelector("#section--1").scrollIntoView({ behavior: "smooth" });
});

document.querySelector(".header__btn").addEventListener("click", (e) => {
  e.preventDefault();
  console.log(" document.querySelector", document.querySelector("#section--1"));
  document.querySelector("#section--1").scrollIntoView({ behavior: "smooth" });
});
