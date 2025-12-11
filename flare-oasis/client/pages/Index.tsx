import { useState } from "react";
import { Home, Clock, BarChart3, Settings, Calendar } from "lucide-react";

export default function Index() {
  const [activeDay, setActiveDay] = useState(1);

  const weekDays = [
    { day: "Wed", date: 11, dots: ["#7CACE2", "#20202033"] },
    { day: "Thu", date: 12, dots: ["#1A66FF", "#FAFAFA"] },
    { day: "Fri", date: 13, dots: ["#7CACE2", "#20202033"] },
    { day: "Sat", date: 14, dots: ["#7CACE2", "#20202033"] },
    { day: "Sun", date: 15, dots: ["#7CACE2", "#20202033"] },
    { day: "Mon", date: 16, dots: ["#7CACE2", "#20202033"] },
  ];

  const tasks = [
    {
      title: "Start Time",
      subtitle: "Set start time manually",
      icon: "refresh",
      action: "play",
    },
    {
      title: "Break",
      subtitle: "10 minutes",
      icon: "coffee",
      action: "edit",
    },
    {
      title: "Office Work",
      subtitle: "3 Hours 30 Minutes",
      icon: "briefcase",
      action: "play",
    },
  ];

  const checklist = [
    "Create your first time entry",
    "Enable Notification",
    "Assign a project to your time entry",
  ];

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
      {/* Status Bar */}
      <div className="h-[59px] w-full bg-white"></div>

      {/* Header */}
      <header className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-2">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
          >
            <rect width="32" height="32" rx="16" fill="#1A66FF" />
            <path
              d="M16 4C9.38182 4 4 9.38182 4 16C4 22.6182 9.38182 28 16 28C22.6182 28 28 22.6182 28 16C28 9.38182 22.6182 4 16 4ZM16 27.2727C9.78462 27.2727 4.72727 22.2154 4.72727 16C4.72727 9.78462 9.78462 4.72727 16 4.72727C22.2154 4.72727 27.2727 9.78462 27.2727 16C27.2727 22.2154 22.2154 27.2727 16 27.2727Z"
              fill="#FAFAFA"
            />
            <path
              d="M16 6.90909C10.9874 6.90909 6.90909 10.9874 6.90909 16C6.90909 21.0126 10.9874 25.0909 16 25.0909C21.0126 25.0909 25.0909 21.0126 25.0909 16C25.0909 10.9874 21.0126 6.90909 16 6.90909ZM16 24.3636C11.3902 24.3636 7.63636 20.6098 7.63636 16C7.63636 11.3902 11.3902 7.63636 16 7.63636C20.6098 7.63636 24.3636 11.3902 24.3636 16C24.3636 20.6098 20.6098 24.3636 16 24.3636Z"
              fill="#FAFAFA"
            />
            <path
              d="M16 11.0881C16.2014 11.0881 16.3636 10.9259 16.3636 10.7245V9.02378C16.3636 8.82238 16.2014 8.66014 16 8.66014C15.7986 8.66014 15.6364 8.82238 15.6364 9.02378V10.7245C15.6364 10.9203 15.7986 11.0881 16 11.0881Z"
              fill="#FAFAFA"
            />
            <path
              d="M19.7315 12.6322C19.8266 12.6322 19.9161 12.5986 19.9888 12.5259L21.1916 11.3231C21.3315 11.1832 21.3315 10.9483 21.1916 10.8084C21.0517 10.6685 20.8168 10.6685 20.6769 10.8084L19.4741 12.0112C19.3343 12.151 19.3343 12.386 19.4741 12.5259C19.5469 12.5986 19.6364 12.6322 19.7315 12.6322Z"
              fill="#FAFAFA"
            />
            <path
              d="M20.9119 16C20.9119 16.2014 21.0741 16.3636 21.2755 16.3636H22.9762C23.1776 16.3636 23.3399 16.2014 23.3399 16C23.3399 15.7986 23.1776 15.6364 22.9762 15.6364H21.2755C21.0797 15.6364 20.9119 15.7986 20.9119 16Z"
              fill="#FAFAFA"
            />
            <path
              d="M19.9888 19.4741C19.849 19.3343 19.614 19.3343 19.4741 19.4741C19.3343 19.614 19.3343 19.849 19.4741 19.9888L20.6769 21.1916C20.7497 21.2643 20.8392 21.2979 20.9343 21.2979C21.0294 21.2979 21.1189 21.2643 21.1916 21.1916C21.3315 21.0517 21.3315 20.8168 21.1916 20.6769L19.9888 19.4741Z"
              fill="#FAFAFA"
            />
            <path
              d="M16 20.9119C15.7986 20.9119 15.6364 21.0741 15.6364 21.2755V22.9762C15.6364 23.1776 15.7986 23.3399 16 23.3399C16.2014 23.3399 16.3636 23.1776 16.3636 22.9762V21.2755C16.3636 21.0797 16.2014 20.9119 16 20.9119Z"
              fill="#FAFAFA"
            />
            <path
              d="M12.0112 19.4741L10.8084 20.6769C10.6685 20.8168 10.6685 21.0517 10.8084 21.1916C10.8811 21.2643 10.9706 21.2979 11.0657 21.2979C11.1608 21.2979 11.2503 21.2643 11.3231 21.1916L12.5259 19.9888C12.6657 19.849 12.6657 19.614 12.5259 19.4741C12.3804 19.3343 12.151 19.3343 12.0112 19.4741Z"
              fill="#FAFAFA"
            />
            <path
              d="M11.0881 16C11.0881 15.7986 10.9259 15.6364 10.7245 15.6364H9.02378C8.82238 15.6364 8.66014 15.7986 8.66014 16C8.66014 16.2014 8.82238 16.3636 9.02378 16.3636H10.7245C10.9203 16.3636 11.0881 16.2014 11.0881 16Z"
              fill="#FAFAFA"
            />
            <path
              d="M11.3231 10.8084C11.1832 10.6685 10.9483 10.6685 10.8084 10.8084C10.6685 10.9483 10.6685 11.1832 10.8084 11.3231L12.0112 12.5259C12.0839 12.5986 12.1734 12.6322 12.2685 12.6322C12.3636 12.6322 12.4531 12.5986 12.5259 12.5259C12.6657 12.386 12.6657 12.151 12.5259 12.0112L11.3231 10.8084Z"
              fill="#FAFAFA"
            />
            <path
              d="M17.4378 16.9231C17.6112 16.649 17.7007 16.3301 17.7007 16C17.7007 15.1888 17.1245 14.5063 16.3636 14.3385V12.0895C16.3636 11.8881 16.2014 11.7259 16 11.7259C15.7986 11.7259 15.6364 11.8881 15.6364 12.0895V14.3385C14.8699 14.5063 14.2993 15.1888 14.2993 16C14.2993 16.9399 15.0601 17.7007 16 17.7007C16.3301 17.7007 16.649 17.6056 16.9231 17.4378L17.6056 18.1203C17.6783 18.193 17.7678 18.2266 17.8629 18.2266C17.958 18.2266 18.0476 18.193 18.1203 18.1203C18.2601 17.9804 18.2601 17.7455 18.1203 17.6056L17.4378 16.9231ZM16 16.9734C15.4517 16.9734 15.0266 16.5427 15.0266 16C15.0266 15.4517 15.4573 15.0266 16 15.0266C16.5427 15.0266 16.9734 15.4573 16.9734 16C16.9734 16.0951 16.9622 16.1902 16.9343 16.2853C16.8895 16.4364 16.8112 16.5762 16.6993 16.6993C16.5538 16.8336 16.3804 16.9231 16.1958 16.9566C16.1287 16.9678 16.0671 16.9734 16 16.9734Z"
              fill="#FAFAFA"
            />
          </svg>
          <h1 className="text-xl font-bold text-[#202020] capitalize">
            Tempo Track
          </h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center bg-[#FAFAFA] rounded-full">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="40" height="40" rx="20" fill="#FAFAFA" />
            <path
              d="M17.1562 20C17.1562 20.8477 16.4453 21.5312 15.625 21.5312C14.7773 21.5312 14.0938 20.8477 14.0938 20C14.0938 19.1797 14.7773 18.4688 15.625 18.4688C16.4453 18.4688 17.1562 19.1797 17.1562 20ZM21.5312 20C21.5312 20.8477 20.8203 21.5312 20 21.5312C19.1523 21.5312 18.4688 20.8477 18.4688 20C18.4688 19.1797 19.1523 18.4688 20 18.4688C20.8203 18.4688 21.5312 19.1797 21.5312 20ZM22.8438 20C22.8438 19.1797 23.5273 18.4688 24.375 18.4688C25.1953 18.4688 25.9062 19.1797 25.9062 20C25.9062 20.8477 25.1953 21.5312 24.375 21.5312C23.5273 21.5312 22.8438 20.8477 22.8438 20Z"
              fill="#202020"
            />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        {/* Date Section */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2 opacity-70">
            <Calendar className="w-3.5 h-3.5 text-[#202020]" />
            <p className="text-sm text-[#202020]">March 12, 2025, Tuesday</p>
          </div>
          <h2 className="text-[22px] font-bold text-[#170A21] leading-7">
            Today Working Hours
          </h2>
        </div>

        {/* Working Hours Card */}
        <div className="border border-[#EFEFEF] rounded-xl overflow-hidden mb-6">
          {/* Progress Section */}
          <div className="bg-[#1A66FF1A] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-[#00082D] capitalize">
                Working hours
              </h3>
              <span className="text-sm font-semibold text-[#00082D]">
                2hr 45min
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-4 flex items-center">
                <div className="flex-1 h-1 bg-[#1A66FF33] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1A66FF] rounded-full"
                    style={{ width: "33%" }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-[#202020] opacity-70 leading-[18px]">
                12% task complete for today - You can do this!
              </p>
            </div>
          </div>

          {/* Checklist Section */}
          <div className="bg-white border-t border-[#EFEFEF] p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#00082D]">
                Getting started first!
              </h3>
              <svg
                width="11"
                height="7"
                viewBox="0 0 11 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.24316 0C5.48926 0 5.70801 0.0820312 5.87207 0.246094L10.2471 4.62109C10.6025 4.94922 10.6025 5.52344 10.2471 5.85156C9.91895 6.20703 9.34473 6.20703 9.0166 5.85156L5.24316 2.10547L1.49707 5.85156C1.16895 6.20703 0.594727 6.20703 0.266602 5.85156C-0.0888672 5.52344 -0.0888672 4.94922 0.266602 4.62109L4.6416 0.246094C4.80566 0.0820312 5.02441 0 5.24316 0Z"
                  fill="#202020"
                />
              </svg>
            </div>

            <hr className="border-[#EFEFEF]" />

            <div className="flex flex-col gap-3">
              {checklist.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0 6C0 2.69531 2.67188 0 6 0C9.30469 0 12 2.69531 12 6C12 9.32812 9.30469 12 6 12C2.67188 12 0 9.32812 0 6ZM8.69531 4.96875C8.95312 4.71094 8.95312 4.3125 8.69531 4.05469C8.4375 3.79688 8.03906 3.79688 7.78125 4.05469L5.25 6.58594L4.19531 5.55469C3.9375 5.29688 3.53906 5.29688 3.28125 5.55469C3.02344 5.8125 3.02344 6.21094 3.28125 6.46875L4.78125 7.96875C5.03906 8.22656 5.4375 8.22656 5.69531 7.96875L8.69531 4.96875Z"
                          fill="#1A66FF"
                        />
                      </svg>
                      <p className="text-sm text-[#00082D]">{item}</p>
                    </div>
                    <svg
                      width="7"
                      height="11"
                      viewBox="0 0 7 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.11816 5.24316C6.11816 5.48926 6.03613 5.70801 5.87207 5.87207L1.49707 10.2471C1.16895 10.6025 0.594727 10.6025 0.266602 10.2471C-0.0888672 9.91895 -0.0888672 9.34473 0.266602 9.0166L4.0127 5.24316L0.266602 1.49707C-0.0888672 1.16895 -0.0888672 0.594727 0.266602 0.266602C0.594727 -0.0888672 1.16895 -0.0888672 1.49707 0.266602L5.87207 4.6416C6.03613 4.80566 6.11816 5.02441 6.11816 5.24316Z"
                        fill="#202020"
                      />
                    </svg>
                  </div>
                  {index < checklist.length - 1 && (
                    <hr className="border-[#EFEFEF] mt-3" />
                  )}
                </div>
              ))}
            </div>

            <button className="w-full bg-[#1A66FF] text-white text-sm font-semibold py-4 px-6 rounded-full">
              Set your first working task
            </button>
          </div>
        </div>

        {/* Task Today Section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-[#00082D] capitalize">
              Task Today
            </h3>
            <span className="text-sm font-semibold text-[#202020] opacity-70">
              See All
            </span>
          </div>

          {/* Calendar */}
          <div className="flex gap-0 overflow-x-auto">
            {weekDays.map((day, index) => (
              <button
                key={index}
                onClick={() => setActiveDay(index)}
                className={`flex-1 min-w-[57.5px] flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                  index === activeDay ? "bg-[#00082D]" : "bg-white"
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    index === activeDay
                      ? "text-[#FAFAFA] opacity-70"
                      : "text-[#202020] opacity-70"
                  }`}
                >
                  {day.day}
                </span>
                <span
                  className={`text-base font-semibold ${
                    index === activeDay ? "text-[#FAFAFA]" : "text-[#202020]"
                  }`}
                >
                  {day.date}
                </span>
                <div className="flex gap-0.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: day.dots[0] }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: day.dots[1] }}
                  ></div>
                </div>
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="flex flex-col gap-2">
            {tasks.map((task, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 pr-4 border border-[#EFEFEF] rounded-2xl bg-white"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full border border-[#1A66FF] bg-[#7C7EE21A]">
                    {task.icon === "refresh" && (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="0.5"
                          y="0.5"
                          width="47"
                          height="47"
                          rx="23.5"
                          fill="#7C7EE2"
                          fillOpacity="0.1"
                        />
                        <rect
                          x="0.5"
                          y="0.5"
                          width="47"
                          height="47"
                          rx="23.5"
                          stroke="#1A66FF"
                        />
                        <path
                          d="M30.375 17.0156C30.8125 17.0156 31.25 17.3281 31.25 17.8594V22.4219C31.25 22.7344 30.9688 23.0156 30.625 23.0156H26.0938C25.5625 23.0156 25.25 22.5781 25.25 22.1719C25.25 21.9531 25.3125 21.7344 25.5 21.5781L26.9062 20.1406C26.0312 19.4219 24.9062 19.0156 23.7188 19.0156C20.9688 19.0156 18.75 21.2656 18.75 24.0156C18.75 26.7656 20.9688 28.9844 23.7188 28.9844C26.0312 28.9844 26.5312 27.7969 27.3438 27.7969C27.9062 27.7969 28.3125 28.2656 28.3125 28.7969C28.3125 29.8906 25.7812 30.9844 23.7188 30.9844C19.875 30.9844 16.75 27.8594 16.75 24.0156C16.75 20.1406 19.875 17.0156 23.75 17.0156C25.4375 17.0156 27.0625 17.6406 28.3125 18.7344L29.8125 17.2656C29.9688 17.0781 30.1875 17.0156 30.375 17.0156Z"
                          fill="#1A66FF"
                        />
                      </svg>
                    )}
                    {task.icon === "coffee" && (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="0.5"
                          y="0.5"
                          width="47"
                          height="47"
                          rx="23.5"
                          fill="#7C7EE2"
                          fillOpacity="0.1"
                        />
                        <rect
                          x="0.5"
                          y="0.5"
                          width="47"
                          height="47"
                          rx="23.5"
                          stroke="#1A66FF"
                        />
                        <path
                          d="M30 17C32.1875 17 34 18.8125 34 21C34 23.2188 32.1875 25 30 25H29C29 26.6562 27.6562 28 26 28H20C18.3438 28 17 26.6562 17 25V17.75C17 17.3438 17.3125 17 17.75 17H30ZM30 23C31.0938 23 32 22.125 32 21C32 19.9062 31.0938 19 30 19H29V23H30ZM31.5 29C31.75 29 32 29.25 32 29.5C32 30.3438 31.3125 31 30.5 31H15.5C14.6562 31 14 30.3438 14 29.5C14 29.25 14.2188 29 14.5 29H31.5Z"
                          fill="#1A66FF"
                        />
                      </svg>
                    )}
                    {task.icon === "briefcase" && (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="0.5"
                          y="0.5"
                          width="47"
                          height="47"
                          rx="23.5"
                          fill="#7C7EE2"
                          fillOpacity="0.1"
                        />
                        <rect
                          x="0.5"
                          y="0.5"
                          width="47"
                          height="47"
                          rx="23.5"
                          stroke="#1A66FF"
                        />
                        <path
                          d="M26 27V25.5H32V30C32 30.8125 31.2812 31.5 30.5 31.5H17.5C16.6875 31.5 16 30.8125 16 30V25.5H22V27C22 27.2812 22.2188 27.5 22.5 27.5H25.5C25.75 27.5 26 27.2812 26 27ZM30.5 19.5C31.2812 19.5 32 20.2188 32 21V24.5H16V21C16 20.2188 16.6875 19.5 17.5 19.5H20V18C20 17.2188 20.6875 16.5 21.5 16.5H26.5C27.2812 16.5 28 17.2188 28 18V19.5H30.5ZM26.5 19.5V18H21.5V19.5H26.5Z"
                          fill="#1A66FF"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <h4 className="text-base font-semibold text-[#170A21] capitalize leading-6">
                      {task.title}
                    </h4>
                    <p className="text-sm text-[#1A66FF] leading-[22px]">
                      {task.subtitle}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-2xl ${
                    task.action === "play" ? "bg-[#F79C21]" : "bg-[#EFEFEF]"
                  }`}
                >
                  {task.action === "play" ? (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="32" height="32" rx="16" fill="#F79C21" />
                      <path
                        d="M19.9609 15.0315C20.2891 15.2425 20.5 15.6175 20.5 15.9925C20.5 16.3909 20.2891 16.7659 19.9609 16.9534L13.2109 21.0784C12.8594 21.2894 12.4141 21.3128 12.0625 21.1019C11.7109 20.9144 11.5 20.5394 11.5 20.1175V11.8675C11.5 11.469 11.7109 11.094 12.0625 10.9065C12.4141 10.6956 12.8594 10.6956 13.2109 10.93L19.9609 15.0315Z"
                        fill="#FAFAFA"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="32" height="32" rx="16" fill="#EFEFEF" />
                      <path
                        d="M18.5076 10.45C19.0936 9.86407 20.0545 9.86407 20.6405 10.45L21.5545 11.3641C22.1405 11.95 22.1405 12.9109 21.5545 13.4969L20.4295 14.6219L17.3826 11.575L18.5076 10.45ZM19.8905 15.1609L14.4295 20.6219C14.1951 20.8563 13.8905 21.0438 13.5623 21.1375L10.7264 21.9578C10.5389 22.0281 10.328 21.9813 10.1873 21.8172C10.0233 21.6766 9.9764 21.4656 10.0233 21.2781L10.867 18.4422C10.9608 18.1141 11.1483 17.8094 11.3826 17.575L16.8436 12.1141L19.8905 15.1609Z"
                        fill="#202020"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Input */}
      <div className="fixed bottom-[107px] left-0 right-0 flex items-center justify-between px-6 py-3 border-t border-[#EFEFEF] bg-[#FAFAFA]">
        <input
          type="text"
          placeholder="I'm working on..."
          className="flex-1 bg-transparent text-sm text-[#202020] opacity-70 outline-none"
        />
        <button className="w-[49px] h-[45px] flex items-center justify-center bg-[#1A66FF] rounded-full">
          <svg
            width="49"
            height="45"
            viewBox="0 0 49 45"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="49" height="44.2473" rx="22.1236" fill="#1A66FF" />
            <path
              d="M29.1211 20.9938C29.5039 21.2399 29.75 21.6774 29.75 22.1149C29.75 22.5797 29.5039 23.0172 29.1211 23.236L21.2461 28.0485C20.8359 28.2946 20.3164 28.3219 19.9062 28.0758C19.4961 27.8571 19.25 27.4196 19.25 26.9274V17.3024C19.25 16.8375 19.4961 16.4 19.9062 16.1813C20.3164 15.9352 20.8359 15.9352 21.2461 16.2086L29.1211 20.9938Z"
              fill="#FAFAFA"
            />
          </svg>
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/67 backdrop-blur-md rounded-t-2xl pt-4 pb-6">
        <div className="flex items-center justify-center gap-3 px-6">
          <button className="flex flex-col items-center gap-0 min-w-[65px]">
            <div className="w-10 h-10 flex items-center justify-center">
              <Home className="w-7 h-6 text-[#00082D]" fill="#00082D" />
            </div>
            <span className="text-xs text-[#00082D]">Home</span>
          </button>

          <button className="flex flex-col items-center gap-0 min-w-[65px] opacity-40">
            <div className="w-10 h-10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#00082D]" />
            </div>
            <span className="text-xs text-[#00082D]">Timesheet</span>
          </button>

          <button className="w-[58px] h-[58px] flex items-center justify-center bg-[#1A66FF] rounded-full -mt-2">
            <svg
              width="58"
              height="58"
              viewBox="0 0 58 58"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="58" height="58" rx="29" fill="#1A66FF" />
              <path
                d="M20 18.125C20 17.5156 20.4688 17 21.125 17H36.875C37.4844 17 38 17.5156 38 18.125C38 18.7812 37.4844 19.25 36.875 19.25H36.5V20.1406C36.5 22.0625 35.7031 23.8438 34.3906 25.2031L30.5469 29L34.3906 32.8438C35.7031 34.1562 36.5 35.9844 36.5 37.8594V38.75H36.875C37.4844 38.75 38 39.2656 38 39.875C38 40.5312 37.4844 41 36.875 41H21.125C20.4688 41 20 40.5312 20 39.875C20 39.2656 20.4688 38.75 21.125 38.75H21.5V37.8594C21.5 35.9844 22.25 34.1562 23.5625 32.8438L27.4062 29L23.5625 25.2031C22.25 23.8438 21.5 22.0625 21.5 20.1406V19.25H21.125C20.4688 19.25 20 18.7812 20 18.125ZM24.6406 35H33.3125C33.1719 34.8125 32.9844 34.625 32.7969 34.4375L29 30.5938L25.1562 34.4375C24.9688 34.625 24.7812 34.8125 24.6406 35ZM33.3125 23C33.875 22.2031 34.25 21.2188 34.25 20.1406V19.25H23.75V20.1406C23.75 21.2188 24.0781 22.2031 24.6406 23H33.3125Z"
                fill="#FAFAFA"
              />
            </svg>
          </button>

          <button className="flex flex-col items-center gap-0 min-w-[65px] opacity-40">
            <div className="w-10 h-10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#00082D]" />
            </div>
            <span className="text-xs text-[#00082D]">Reports</span>
          </button>

          <button className="flex flex-col items-center gap-0 min-w-[65px] opacity-40">
            <div className="w-10 h-10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#00082D]" />
            </div>
            <span className="text-xs text-[#00082D]">Setting</span>
          </button>
        </div>

        {/* Home Indicator */}
        <div className="flex justify-center mt-2">
          <div className="w-[139px] h-[5px] bg-black rounded-full"></div>
        </div>
      </nav>
    </div>
  );
}
