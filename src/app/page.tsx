"use client"

import { useEffect, useRef, useState } from "react"
import {
  Send,
  Copy,
  ExternalLink,
  CheckCircle,
  Edit2,
  Save,
  Calendar as CalendarIcon,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Menu,
} from "lucide-react"

import { cn } from "@/lib/utils"

type Message = {
  role: "user" | "assistant"
  content: string
}

type ScheduledPost = {
  id: number
  content: string
  date: string
  time: string
  notes?: string
  profile: string
  profileName: string
  createdAt: string
}

type PromptSection = "master" | "about" | "tone" | "company" | "market" | "linkedin"

type PromptState = {
  master: string
  about: Record<string, string>
  tone: Record<string, string>
  company: string
  market: string
  linkedin: string
}

const profiles = [
  { id: "simmi", name: "Simmi Sen Roy" },
  { id: "aastha", name: "Aastha Tomar" },
  { id: "company", name: "Nextyou Company" },
]

const promptSections: { id: PromptSection; title: string }[] = [
  { id: "master", title: "Master Prompt" },
  { id: "about", title: "About" },
  { id: "tone", title: "Tone Setting" },
  { id: "company", title: "Company - Nextyou" },
  { id: "market", title: "Market Research" },
  { id: "linkedin", title: "LinkedIn Algorithm" },
]

const initialPrompts: PromptState = {
  master: `You are an expert LinkedIn content writer for Nextyou, a career transformation platform. Your primary goals are:
\n1. Create engaging, authentic content that resonates with professionals
2. Balance professionalism with personality - be relatable, not corporate
3. Drive meaningful engagement through value-driven posts
4. Maintain consistency with Nextyou's brand voice and mission
5. Optimize content for LinkedIn's algorithm while keeping it human-centered
\nKey Content Principles:
- Lead with value - every post should teach, inspire, or provide actionable insights
- Use storytelling to make concepts relatable and memorable
- Be concise yet comprehensive - respect the reader's time
- Include clear takeaways or calls-to-action
- Stay current with industry trends and conversations
- Encourage dialogue and community building
\nContent Strategy:
- Mix educational content (60%), inspirational stories (25%), and company updates (15%)
- Use data and examples to support claims
- Address real pain points and challenges professionals face
- Celebrate wins and learning moments
- Foster a growth mindset and career empowerment
\nAlways adapt your writing to the selected profile's unique voice while maintaining these core principles.`,
  about: {
    simmi: `Simmi Sen Roy - Founder & CEO of Nextyou
- Serial entrepreneur and career transformation expert
- 10+ years in EdTech and career development
- Passionate about helping professionals unlock their potential
- Speaker and thought leader in career growth strategies`,
    aastha: `Aastha Tomar - Head of Content & Community at Nextyou
- Content strategist with expertise in professional branding
- Community builder focused on career development
- Strong advocate for continuous learning and upskilling
- Engaging storyteller who connects with professionals`,
    company: `Nextyou - Career Transformation Platform
- Leading platform for professional development and career transitions
- Offers personalized coaching, skill development, and career guidance
- Empowering professionals to achieve their next career milestone
- Trusted by 10,000+ professionals across industries`,
  },
  tone: {
    simmi: `Professional yet approachable, inspiring and motivational. Use personal anecdotes and insights. Be authentic and relatable. Focus on empowerment and growth mindset. Keep it conversational but authoritative.`,
    aastha: `Warm, engaging, and community-focused. Use storytelling and relatable examples. Be encouraging and supportive. Create content that sparks conversation and builds connections. Friendly and accessible tone.`,
    company: `Professional, credible, and value-driven. Focus on insights and actionable advice. Be authoritative but not corporate. Emphasize results and transformation. Educational and informative tone.`,
  },
  company: `Nextyou is a career transformation platform that helps professionals navigate career transitions, develop new skills, and achieve their professional goals. We offer:
\n- Personalized 1-on-1 career coaching
- Skill development programs
- Industry insights and market research
- Resume and LinkedIn optimization
- Interview preparation and negotiation support
- Community of like-minded professionals
\nOur mission: Empower every professional to take control of their career journey and unlock their full potential.`,
  market: `Current Career Development Market Insights:
\nIndustry Trends:
- 65% of professionals are considering career changes post-pandemic
- Remote work has opened new opportunities across geographies
- Skills gap is widening; continuous learning is essential
- Personal branding on LinkedIn is more important than ever
- AI and automation are reshaping job markets`,
  linkedin: `LinkedIn Algorithm Best Practices (2025):
\nContent that performs well:
- Posts between 1,000-1,500 characters get highest engagement
- First 3 lines are crucial (visible before "see more")
- Use line breaks for readability
- 3-5 relevant hashtags (not more)
- Ask questions to drive comments
- Share personal stories and insights`,
}

export default function Page() {
  const [selectedProfile, setSelectedProfile] = useState<string>("simmi")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptSection | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"chat" | "calendar">("chat")
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [postToSave, setPostToSave] = useState("")
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [viewingPost, setViewingPost] = useState<ScheduledPost | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const showToastWithMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const [prompts, setPrompts] = useState<PromptState>(initialPrompts)

  const handlePromptUpdate = (section: PromptSection, value: string) => {
    setPrompts(prev => ({
      ...prev,
      [section]: typeof prev[section] === "object" && !["company", "market", "linkedin", "master"].includes(section)
        ? { ...(prev[section] as Record<string, string>), [selectedProfile]: value }
        : value,
    }))
    setEditingPrompt(null)
  }

  const getCurrentPrompt = (section: PromptSection) => {
    const prompt = prompts[section]
    if (typeof prompt === "object" && !["company", "market", "linkedin", "master"].includes(section)) {
      return (prompt as Record<string, string>)[selectedProfile] || ""
    }
    return prompt || ""
  }

  const buildSystemPrompt = () => {
    const masterText = getCurrentPrompt("master")
    const aboutText = getCurrentPrompt("about")
    const toneText = getCurrentPrompt("tone")
    const companyText = getCurrentPrompt("company")
    const marketText = getCurrentPrompt("market")
    const linkedinText = getCurrentPrompt("linkedin")

    return `${masterText}

---

WRITING AS: ${profiles.find(p => p.id === selectedProfile)?.name}

${aboutText}

TONE AND STYLE:
${toneText}

COMPANY INFORMATION:
${companyText}

MARKET INSIGHTS:
${marketText}

LINKEDIN BEST PRACTICES:
${linkedinText}

When creating LinkedIn posts:
1. Start with a strong hook in the first 2-3 lines
2. Use short paragraphs and line breaks for readability
3. Include personal insights or stories when relevant
4. End with a clear call-to-action or question
5. Add 3-5 relevant hashtags at the end
6. Keep the tone consistent with the profile
7. Make it valuable and actionable for the audience
8. Aim for 1,000-1,500 characters for optimal engagement`
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: inputMessage }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: buildSystemPrompt(), messages: updatedMessages }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Generation request failed")
      }

      const text = data.content?.trim()
      if (!text) {
        throw new Error("AI returned an empty response")
      }

      setMessages(prev => [...prev, { role: "assistant", content: text }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error ? `Sorry, there was an error: ${error.message}` : "Sorry, something went wrong.",
        },
      ])
      showToastWithMessage("Issue reaching the AI service")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToastWithMessage("Content copied to clipboard")
  }

  const postToLinkedIn = (text: string) => {
    copyToClipboard(text)
    setTimeout(() => {
      const linkedInUrl =
        selectedProfile === "company" ? "https://www.linkedin.com/company/nextyou/" : "https://www.linkedin.com/feed/"
      if (typeof window !== "undefined") {
        window.open(linkedInUrl, "_blank")
      }
    }, 500)
  }

  const openSaveModal = (content: string) => {
    setPostToSave(content)
    setShowSaveModal(true)
  }

  const savePost = (date: string, time: string, notes: string) => {
    const newPost: ScheduledPost = {
      id: Date.now(),
      content: postToSave,
      date,
      time,
      notes,
      profile: selectedProfile,
      profileName: profiles.find(p => p.id === selectedProfile)?.name || "Nextyou",
      createdAt: new Date().toISOString(),
    }
    setScheduledPosts(prev => [...prev, newPost])
    setShowSaveModal(false)
    showToastWithMessage("Post saved to calendar")
  }

  const deletePost = (id: number) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== id))
    setViewingPost(null)
    showToastWithMessage("Post deleted")
  }

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => new Date(post.date).toDateString() === date.toDateString())
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    return { daysInMonth, startingDayOfWeek }
  }

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  const SavePostModal = () => {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [time, setTime] = useState("09:00")
    const [notes, setNotes] = useState("")
    const [showCalendar, setShowCalendar] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [calendarMonth, setCalendarMonth] = useState(new Date())
    const calendarRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
          setShowCalendar(false)
        }
      }

      if (showCalendar) {
        document.addEventListener("mousedown", handleClickOutside)
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [showCalendar])

    const getDaysInCalendarMonth = (date: Date) => {
      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const prevLastDay = new Date(year, month, 0)
      return {
        daysInMonth: lastDay.getDate(),
        startingDayOfWeek: firstDay.getDay(),
        prevDaysInMonth: prevLastDay.getDate(),
      }
    }

    const handleDateSelect = (dateValue: Date) => {
      setSelectedDate(dateValue)
      setDate(dateValue.toISOString().split("T")[0])
      setShowCalendar(false)
    }

    const CalendarPicker = () => {
      const { daysInMonth, startingDayOfWeek, prevDaysInMonth } = getDaysInCalendarMonth(calendarMonth)
      const days: JSX.Element[] = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevDaysInMonth - i
        days.push(
          <div key={`prev-${day}`} className="w-6 h-6 flex items-center justify-center">
            <span className="text-[9px] text-gray-300">{day}</span>
          </div>
        )
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateValue = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
        dateValue.setHours(0, 0, 0, 0)
        const isToday = dateValue.getTime() === today.getTime()
        const isSelected = dateValue.toISOString().split("T")[0] === selectedDate.toISOString().split("T")[0]

        days.push(
          <button
            key={day}
            onClick={() => handleDateSelect(dateValue)}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-medium transition-all hover:bg-gray-100",
              isSelected && "bg-blue-500 text-white hover:bg-blue-600",
              isToday && !isSelected && "bg-blue-50 text-blue-600"
            )}
          >
            {day}
          </button>
        )
      }

      const totalCells = days.length
      const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
      for (let day = 1; day <= remainingCells; day++) {
        days.push(
          <div key={`next-${day}`} className="w-6 h-6 flex items-center justify-center">
            <span className="text-[9px] text-gray-300">{day}</span>
          </div>
        )
      }

      return (
        <div
          ref={calendarRef}
          className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-10 w-56"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
              className="p-0.5 hover:bg-gray-100 rounded transition"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <div className="text-xs font-medium text-gray-700">
              {calendarMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
              className="p-0.5 hover:bg-gray-100 rounded transition"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map(day => (
              <div key={day} className="text-center text-[10px] font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0">{days}</div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Schedule Post
              </h2>
              <button onClick={() => setShowSaveModal(false)} className="hover:bg-gray-100 p-2 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Preview</label>
              <div className="bg-gray-50 rounded border border-gray-200 p-3 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{postToSave}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-left focus:outline-none focus:ring-2 focus:ring-black text-sm hover:bg-gray-50 transition"
                >
                  {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </button>
                {showCalendar && <CalendarPicker />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={event => setTime(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Add any notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => savePost(date, time, notes)}
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-medium"
              >
                Save to Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ViewPostModal = ({ post }: { post: ScheduledPost }) => {
    const [showReschedule, setShowReschedule] = useState(false)
    const [rescheduleDate, setRescheduleDate] = useState(post.date)
    const [rescheduleTime, setRescheduleTime] = useState(post.time)

    const handleReschedule = () => {
      setScheduledPosts(prev => prev.map(p => (p.id === post.id ? { ...p, date: rescheduleDate, time: rescheduleTime } : p)))
      setShowReschedule(false)
      setViewingPost(null)
      showToastWithMessage("Post rescheduled")
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">Scheduled Post</h2>
                <p className="text-sm text-gray-500">{post.profileName}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{post.time}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingPost(null)
                  setShowReschedule(false)
                }}
                className="hover:bg-gray-100 p-2 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {showReschedule ? (
              <div className="space-y-4">
                <h3 className="font-medium">Reschedule Post</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={event => setRescheduleDate(event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={event => setRescheduleTime(event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Content</label>
                  <div className="bg-gray-50 rounded border border-gray-200 p-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>
                </div>
                {post.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Notes</label>
                    <div className="bg-gray-50 rounded border border-gray-200 p-4">
                      <p className="text-sm text-gray-700">{post.notes}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
            {showReschedule ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReschedule(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  className="flex-1 px-4 py-2.5 bg-black text-white rounded hover:bg-gray-800 font-medium transition"
                >
                  Confirm Reschedule
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => deletePost(post.id)}
                  className="px-4 py-2.5 border border-red-200 text-red-600 rounded hover:bg-red-50 font-medium flex items-center gap-2 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setShowReschedule(true)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-white font-medium flex items-center gap-2 transition"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Reschedule
                </button>
                <button
                  onClick={() => postToLinkedIn(post.content)}
                  className="flex-1 px-4 py-2.5 bg-black text-white rounded hover:bg-gray-800 font-medium flex items-center gap-2 justify-center transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Post to LinkedIn
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const CalendarView = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)
    const days: JSX.Element[] = []
    const today = new Date()

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateValue = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const postsForDay = getPostsForDate(dateValue)
      const isToday = dateValue.toDateString() === today.toDateString()

      days.push(
        <div
          key={day}
          className={cn(
            "aspect-square p-2 border rounded hover:bg-gray-50 transition cursor-pointer",
            isToday ? "bg-gray-100 border-black" : "border-gray-200"
          )}
        >
          <div className="h-full flex flex-col">
            <div className={cn("text-sm font-medium mb-1", isToday ? "font-semibold" : "text-gray-700")}>{day}</div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {postsForDay.map(post => (
                <div
                  key={post.id}
                  onClick={() => setViewingPost(post)}
                  className="text-xs p-1 rounded bg-black text-white cursor-pointer hover:bg-gray-800 transition"
                >
                  <div className="font-medium truncate">{post.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Content Calendar</h2>
          <div className="flex items-center gap-4">
            <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium min-w-[180px] text-center">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 flex-1">{days}</div>

        <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{scheduledPosts.length}</span> scheduled posts
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-3 rounded shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {showSaveModal && <SavePostModal />}
      {viewingPost && <ViewPostModal post={viewingPost} />}

      {showSidebar && (
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold mb-4">Nextyou Content Writer</h2>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profile</label>
              <div className="flex flex-col gap-2">
                {profiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded text-left transition",
                      selectedProfile === profile.id
                        ? "bg-black text-white"
                        : "bg-white border border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {profile.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {promptSections.map(section => (
              <div key={section.id} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">{section.title}</h3>
                  {editingPrompt === section.id ? (
                    <button onClick={() => setEditingPrompt(null)} className="p-1 hover:bg-gray-100 rounded">
                      <Save className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => setEditingPrompt(section.id)} className="p-1 hover:bg-gray-100 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {editingPrompt === section.id ? (
                  <textarea
                    value={getCurrentPrompt(section.id)}
                    onChange={event => handlePromptUpdate(section.id, event.target.value)}
                    className="w-full p-2 text-xs border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-black"
                    rows={8}
                  />
                ) : (
                  <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                    {getCurrentPrompt(section.id).substring(0, 150)}
                    {getCurrentPrompt(section.id).length > 150 && "..."}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 flex-shrink-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded">
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold">Content Studio</h1>
                  <p className="text-xs text-gray-500">{profiles.find(p => p.id === selectedProfile)?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded transition",
                  activeTab === "chat" ? "bg-black text-white" : "bg-white border border-gray-200 hover:bg-gray-50"
                )}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded transition flex items-center gap-2",
                  activeTab === "calendar" ? "bg-black text-white" : "bg-white border border-gray-200 hover:bg-gray-50"
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendar
                {scheduledPosts.length > 0 && (
                  <span className="bg-gray-100 text-black text-xs font-semibold px-2 py-0.5 rounded">
                    {scheduledPosts.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create LinkedIn Content</h2>
                  <p className="text-gray-500">Describe the post you want to create</p>
                </div>
              )}

              {messages.map((message, idx) => (
                <div key={idx} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}> 
                  <div
                    className={cn(
                      "max-w-3xl rounded p-4",
                      message.role === "user" ? "bg-black text-white" : "bg-white border border-gray-200"
                    )}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                    {message.role === "assistant" && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </button>
                          <button
                            onClick={() => openSaveModal(message.content)}
                            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                          >
                            <CalendarIcon className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={() => postToLinkedIn(message.content)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded text-sm hover:bg-gray-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={event => setInputMessage(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Describe the content you want..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  Generate
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-y-auto">
            <CalendarView />
          </div>
        )}
      </div>
    </div>
  )
}
