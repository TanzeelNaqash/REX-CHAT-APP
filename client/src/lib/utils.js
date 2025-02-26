import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import animationData from "@/assets/lottie-json"




export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const colors = [
  "bg-[#712c4a57] text-[#ff006e] border-[#ff006faa]",
  "bg-[#1a2d6d] text-[#ff7f50] border-[#e74c3c]",
  "bg-[#ff6347] text-[#2f4f4f] border-[#3cb371]",
  "bg-[#6a1b9a] text-[#ff9800] border-[#e91e63]",
  "bg-[#2c3e50] text-[#f39c12] border-[#2980b9]",
  "bg-[#16a085] text-[#f1c40f] border-[#e67e22]",
  "bg-[#d35400] text-[#ecf0f1] border-[#3498db]",
  "bg-[#8e44ad] text-[#fff] border-[#9b59b6]",
  "bg-[#f39c12] text-[#8e44ad] border-[#e74c3c]",
  "bg-[#2ecc71] text-[#34495e] border-[#16a085]",
];

export const getColor = (color) => {
  if(color >= 0 && color < colors.length){
    return colors[color]
  }
  return colors[0]
}

export const animationDefaultOptions = {
  loop: true,
  autoplay:true,
  animationData,
}