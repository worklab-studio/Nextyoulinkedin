"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, isSameDay } from "date-fns"
import {
  BadgeCheck,
  Calendar as CalendarIcon,
  CalendarClock,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Loader2,
  PencilLine,
  Save,
  Send,
  Trash2,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ProfileId = "simmi" | "aastha" | "company"

type Message = {
  role: "user" | "assistant"
  content: string
}

type ScheduledPost = {
  id: string
  content: string
  date: string
  time: string
  notes?: string
  profile: ProfileId
  profileName: string
  createdAt: string
}

type PromptState = {
  master: string
  about: Record<ProfileId, string>
  tone: Record<ProfileId, string>
  company: string
  market: string
  linkedin: string
}

type PromptSection = "master" | "about" | "tone" | "company" | "market" | "linkedin"

const profileOptions: { id: ProfileId; name: string; role: string }[] = [
  { id: "simmi", name: "Simmi Sen Roy", role: "Founder & CEO" },
  { id: "aastha", name: "Aastha Tomar", role: "Head of Content" },
  { id: "company", name: "Nextyou", role: "Company Voice" },
]

const promptSections: { id: PromptSection; title: string; hint: string }[] = [
  { id: "master", title: "Master Prompt", hint: "Overall brand direction" },
  { id: "about", title: "About", hint: "Selected profile background" },
  { id: "tone", title: "Tone & Voice", hint: "Styling cues" },
  { id: "company", title: "Company", hint: "Product & mission context" },
  { id: "market", title: "Market", hint: "Trends & data" },
  { id: "linkedin", title: "LinkedIn", hint: "Platform best practices" },
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
    simmi:
      "Professional yet approachable, inspiring and motivational. Use personal anecdotes and insights. Be authentic and relatable. Focus on empowerment and growth mindset.",
    aastha:
      "Warm, engaging, and community-focused. Use storytelling and relatable examples. Encourage conversation and spotlight the community.",
    company:
      "Professional, credible, and value-driven. Share actionable insights with a confident but human tone. Lead with data and transformation stories.",
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
  const [selectedProfile, setSelectedProfile] = useState<ProfileId>("simmi")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptSection | null>(null)
  const [prompts, setPrompts] = useState<PromptState>(initialPrompts)
  const [activeTab, setActiveTab] = useState<"chat" | "calendar">("chat")
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [postToSave, setPostToSave] = useState("")
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date())
  const [scheduleTime, setScheduleTime] = useState("09:00")
  const [scheduleNotes, setScheduleNotes] = useState("")
  const [viewingPost, setViewingPost] = useState<ScheduledPost | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null)
  const [rescheduleTime, setRescheduleTime] = useState("09:00")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (viewingPost) {
      setRescheduleDate(new Date(viewingPost.date))
      setRescheduleTime(viewingPost.time)
    }
  }, [viewingPost])

  const getPromptValue = useCallback(
    (section: PromptSection) => {
      if (section === "about" || section === "tone") {
        return prompts[section][selectedProfile]
      }
      return prompts[section]
    },
    [prompts, selectedProfile]
  )

  const handlePromptUpdate = (section: PromptSection, value: string) => {
    if (section === "about" || section === "tone") {
      setPrompts(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [selectedProfile]: value,
        },
      }))
    } else {
      setPrompts(prev => ({
        ...prev,
        [section]: value,
      }))
    }
    setEditingPrompt(null)
  }

  const buildSystemPrompt = useMemo(() => {
    const about = prompts.about[selectedProfile]
    const tone = prompts.tone[selectedProfile]
    const profile = profileOptions.find(p => p.id === selectedProfile)

    return `${prompts.master}
\n---
\nWRITING AS: ${profile?.name}
\n${about}
\nTONE AND STYLE:
${tone}
\nCOMPANY INFORMATION:
${prompts.company}
\nMARKET INSIGHTS:
${prompts.market}
\nLINKEDIN BEST PRACTICES:
${prompts.linkedin}
\nWhen creating LinkedIn posts:
1. Start with a strong hook in the first 2-3 lines
2. Use short paragraphs and line breaks for readability
3. Include personal insights or stories when relevant
4. End with a clear call-to-action or question
5. Add 3-5 relevant hashtags at the end
6. Keep the tone consistent with the profile
7. Make it valuable and actionable for the audience
8. Aim for 1,000-1,500 characters for optimal engagement`
  }, [prompts, selectedProfile])

  const notify = (message: string, variant: "success" | "error" | "info" = "success") => {
    if (variant === "error") return toast.error(message)
    if (variant === "info") return toast.info(message)
    return toast.success(message)
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedMessageId(id)
    notify("Copied to clipboard", "info")
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const postToLinkedIn = (text: string) => {
    copyToClipboard(text, "post")
    const profileUrl =
      selectedProfile === "company"
        ? "https://www.linkedin.com/company/nextyou/"
        : "https://www.linkedin.com/feed/"
    setTimeout(() => window.open(profileUrl, "_blank"), 400)
  }

  const openSaveDialog = (content: string) => {
    setPostToSave(content)
    setScheduleDate(new Date())
    setScheduleTime("09:00")
    setScheduleNotes("")
    setSaveDialogOpen(true)
  }

  const handleSavePost = () => {
    if (!scheduleDate || !postToSave.trim()) return
    const profile = profileOptions.find(p => p.id === selectedProfile)

    const newPost: ScheduledPost = {
      id: crypto.randomUUID(),
      content: postToSave,
      date: scheduleDate.toISOString(),
      time: scheduleTime,
      notes: scheduleNotes,
      profile: selectedProfile,
      profileName: profile?.name || "Nextyou",
      createdAt: new Date().toISOString(),
    }

    setScheduledPosts(prev => [...prev, newPost])
    setSaveDialogOpen(false)
    notify("Post saved to calendar")
  }

  const handleDeletePost = (postId: string) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== postId))
    setViewingPost(null)
    notify("Scheduled post deleted", "info")
  }

  const handleReschedule = () => {
    if (!viewingPost || !rescheduleDate) return
    setScheduledPosts(prev =>
      prev.map(post =>
        post.id === viewingPost.id
          ? { ...post, date: rescheduleDate.toISOString(), time: rescheduleTime }
          : post
      )
    )
    notify("Post rescheduled")
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: inputMessage }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            system: buildSystemPrompt,
            messages: nextMessages,
        }),
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
            error instanceof Error
              ? `Sorry, there was an error: ${error.message}`
              : "Sorry, something went wrong.",
        },
      ])
      notify("Issue reaching the AI service", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const getPostsForDate = (date: Date) =>
    scheduledPosts.filter(post => isSameDay(new Date(post.date), date))

  const totalScheduled = scheduledPosts.length

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const renderMessage = (message: Message, index: number) => {
    const id = `${message.role}-${index}`
    const isUser = message.role === "user"

    return (
      <div key={id} className={cn("flex", isUser ? "justify-end" : "justify-start")}> 
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm shadow-sm max-w-3xl",
            isUser ? "bg-primary text-primary-foreground border-primary" : "bg-card"
          )}
        >
          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
          {!isUser && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => copyToClipboard(message.content, id)}
              >
                <ClipboardCopy className="size-4" />
                {copiedMessageId === id ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => openSaveDialog(message.content)}
              >
                <Save className="size-4" />
                Save
              </Button>
              <Button size="sm" className="gap-2" onClick={() => postToLinkedIn(message.content)}>
                <ExternalLink className="size-4" />
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const CalendarGrid = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const totalDays = new Date(year, month + 1, 0).getDate()
    const startWeekday = firstDay.getDay()

    const cells: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) {
      cells.push(null)
    }
    for (let day = 1; day <= totalDays; day++) {
      cells.push(new Date(year, month, day))
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(label => (
          <div key={label} className="text-center text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
        {cells.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="rounded-lg border border-dashed border-muted" />
          }
          const posts = getPostsForDate(date)
          const isToday = isSameDay(date, new Date())
          return (
            <div
              key={date.toISOString()}
              className={cn(
                "min-h-[120px] rounded-lg border p-2 text-sm",
                isToday ? "border-primary/60 bg-primary/5" : "border-muted"
              )}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{date.getDate()}</span>
                {posts.length > 0 && (
                  <Badge variant="secondary">{posts.length}</Badge>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {posts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => setViewingPost(post)}
                    className="w-full rounded-md bg-muted px-2 py-1 text-left text-xs font-medium hover:bg-accent"
                  >
                    <span className="block truncate">{post.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 lg:flex-row">
        <div className="w-full space-y-6 lg:max-w-xs">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Nextyou Playground</CardTitle>
              <CardDescription>Study the voice, tweak prompts, and plug in your OpenAI key.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Profile</p>
                <div className="mt-3 grid gap-2">
                  {profileOptions.map(profile => (
                    <Button
                      key={profile.id}
                      variant={selectedProfile === profile.id ? "default" : "outline"}
                      className="justify-between"
                      onClick={() => setSelectedProfile(profile.id)}
                    >
                      <span>
                        {profile.name}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {profile.role}
                        </span>
                      </span>
                      {selectedProfile === profile.id && <BadgeCheck className="size-4" />}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Server-managed API key</p>
                    <p>
                      Configure <code className="rounded bg-background px-1 py-0.5 text-[11px] font-mono">OPENAI_API_KEY</code> in
                      your <code className="rounded bg-background px-1 py-0.5 text-[11px] font-mono">.env.local</code> for local
                      runs and add the same variable in Vercel Project Settings for production deployments. The browser never
                      stores your key.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompt Stack</CardTitle>
              <CardDescription>Quickly edit the building blocks powering the system prompt.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-4">
                <div className="space-y-4">
                  {promptSections.map(section => (
                    <div key={section.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{section.title}</p>
                          <p className="text-xs text-muted-foreground">{section.hint}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPrompt(section.id)}
                          aria-label={`Edit ${section.title}`}
                        >
                          <PencilLine className="size-4" />
                        </Button>
                      </div>
                      {editingPrompt === section.id ? (
                        <Textarea
                          className="mt-3 h-40"
                          autoFocus
                          value={getPromptValue(section.id)}
                          onChange={event => handlePromptUpdate(section.id, event.target.value)}
                          onBlur={() => setEditingPrompt(null)}
                        />
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {getPromptValue(section.id).slice(0, 200)}
                          {getPromptValue(section.id).length > 200 && "..."}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="w-full space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Writing for</p>
                <CardTitle>{profileOptions.find(p => p.id === selectedProfile)?.name}</CardTitle>
              </div>
              <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "chat" | "calendar")}> 
                <TabsList>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarIcon className="size-4" /> Calendar
                    {totalScheduled > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {totalScheduled}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab}>
                <TabsContent value="chat" className="space-y-4">
                  <div className="min-h-[420px] space-y-4 overflow-y-auto rounded-lg border bg-background p-4">
                    {messages.length === 0 && !isLoading && (
                      <div className="flex h-60 flex-col items-center justify-center text-center text-muted-foreground">
                        <CalendarClock className="mb-2 size-8" />
                        <p className="font-medium">Describe the post you want to create</p>
                        <p className="text-sm">Mention topic, angle, CTA, or any references.</p>
                      </div>
                    )}
                    {messages.map((message, index) => renderMessage(message, index))}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Crafting your post...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      placeholder="Describe the content you want..."
                      value={inputMessage}
                      onChange={event => setInputMessage(event.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                    />
                    <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()} className="gap-2">
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      Generate
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="calendar" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Content calendar</p>
                      <p className="font-semibold">
                        {format(currentMonth, "MMMM yyyy")} · {totalScheduled} post{totalScheduled === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                        Prev
                      </Button>
                      <Button variant="outline" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                        Next
                      </Button>
                    </div>
                  </div>
                  <CalendarGrid />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule post</DialogTitle>
            <DialogDescription>Pick a date/time and add notes for the team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Post preview</p>
              <div className="mt-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                <pre className="whitespace-pre-wrap">{postToSave}</pre>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={date => date && setScheduleDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Time</p>
                <Input type="time" value={scheduleTime} onChange={event => setScheduleTime(event.target.value)} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Notes (optional)</p>
              <Textarea value={scheduleNotes} onChange={event => setScheduleNotes(event.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePost}>
              Save to calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingPost} onOpenChange={open => !open && setViewingPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scheduled post</DialogTitle>
            {viewingPost && (
              <DialogDescription>
                {format(new Date(viewingPost.date), "PPP")} · {viewingPost.time}
              </DialogDescription>
            )}
          </DialogHeader>
          {viewingPost && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Content</p>
                <div className="mt-2 rounded-lg border bg-muted/40 p-3 text-sm">
                  <pre className="whitespace-pre-wrap">{viewingPost.content}</pre>
                </div>
              </div>
              {viewingPost.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <div className="mt-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                    {viewingPost.notes}
                  </div>
                </div>
              )}
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reschedule date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 size-4" />
                        {rescheduleDate ? format(rescheduleDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={rescheduleDate ?? undefined}
                        onSelect={date => date && setRescheduleDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reschedule time</p>
                  <Input type="time" value={rescheduleTime} onChange={event => setRescheduleTime(event.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={() => viewingPost && handleDeletePost(viewingPost.id)}>
              <Trash2 className="mr-2 size-4" /> Delete
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => viewingPost && copyToClipboard(viewingPost.content, viewingPost.id)}>
              <ClipboardCopy className="mr-2 size-4" /> Copy
            </Button>
            <Button variant="outline" onClick={() => viewingPost && postToLinkedIn(viewingPost.content)}>
              <ExternalLink className="mr-2 size-4" /> Post
            </Button>
            <Button onClick={handleReschedule}>
              <CheckCircle2 className="mr-2 size-4" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
