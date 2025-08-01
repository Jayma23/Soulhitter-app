"use client"

import { useState } from "react"
import { Bell, Home, Menu, MessageSquare, Search, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

export default function MobileApp() {
    const [activeTab, setActiveTab] = useState("home")

    return (
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
            {/* Status Bar */}
            <div className="flex h-6 items-center justify-between bg-black px-4">
                <div className="text-xs font-medium text-white">9:41</div>
                <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
            </div>

            {/* App Header */}
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="mr-2">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Menu</span>
                    </Button>
                    <h1 className="text-lg font-semibold">MyApp</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                        <Search className="h-5 w-5" />
                        <span className="sr-only">Search</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notifications</span>
                    </Button>
                </div>
            </div>

            {/* App Content */}
            <Tabs defaultValue="home" className="h-[500px]">
                <TabsContent value="home" className="h-full overflow-auto p-0">
                    <div className="p-4">
                        <h2 className="mb-4 text-xl font-bold">Welcome back, Alex!</h2>
                        <div className="mb-6 rounded-lg bg-gray-50 p-4">
                            <h3 className="mb-2 font-medium">Today&#39;s Summary</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-md bg-blue-50 p-3">
                                    <p className="text-xs text-gray-500">Tasks</p>
                                    <p className="text-lg font-bold">12/20</p>
                                </div>
                                <div className="rounded-md bg-green-50 p-3">
                                    <p className="text-xs text-gray-500">Completed</p>
                                    <p className="text-lg font-bold">60%</p>
                                </div>
                            </div>
                        </div>

                        <h3 className="mb-3 font-medium">Recent Activity</h3>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((item) => (
                                <Card key={item} className="p-3">
                                    <div className="flex items-center space-x-3">
                                        <Avatar>
                                            <AvatarImage src={`/placeholder.svg?height=40&width=40&query=user${item}`} />
                                            <AvatarFallback>U{item}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">User {item} updated their profile</p>
                                            <p className="text-xs text-gray-500">{item * 10} minutes ago</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="messages" className="h-full overflow-auto p-4">
                    <h2 className="mb-4 text-xl font-bold">Messages</h2>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <Card key={item} className="p-3">
                                <div className="flex items-center space-x-3">
                                    <Avatar>
                                        <AvatarImage src={`/placeholder.svg?height=40&width=40&query=person${item}`} />
                                        <AvatarFallback>P{item}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">Person {item}</p>
                                            <p className="text-xs text-gray-500">{item * 5}m ago</p>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1">This is a preview of the message content...</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="profile" className="h-full overflow-auto">
                    <div className="flex flex-col items-center p-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src="/placeholder.svg?height=96&width=96" />
                            <AvatarFallback>AL</AvatarFallback>
                        </Avatar>
                        <h2 className="mt-4 text-xl font-bold">Alex Johnson</h2>
                        <p className="text-sm text-gray-500">alex@example.com</p>

                        <div className="mt-6 w-full space-y-4">
                            <Card className="p-4">
                                <h3 className="mb-2 font-medium">Account Settings</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm">Edit Profile</p>
                                        <Button variant="ghost" size="sm">
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm">Notifications</p>
                                        <Button variant="ghost" size="sm">
                                            <Bell className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm">Privacy</p>
                                        <Button variant="ghost" size="sm">
                                            <User className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4">
                                <h3 className="mb-2 font-medium">App Settings</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm">Dark Mode</p>
                                        <div className="h-4 w-8 rounded-full bg-gray-200 px-0.5">
                                            <div className="h-3 w-3 translate-y-0.5 rounded-full bg-gray-400"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm">Notifications</p>
                                        <div className="h-4 w-8 rounded-full bg-blue-500 px-0.5">
                                            <div className="h-3 w-3 translate-x-4 translate-y-0.5 rounded-full bg-white"></div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Button variant="outline" className="w-full bg-transparent">
                                Log Out
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="home" onClick={() => setActiveTab("home")} className="py-3">
                            <div className="flex flex-col items-center">
                                <Home className={`h-5 w-5 ${activeTab === "home" ? "text-blue-500" : ""}`} />
                                <span className={`mt-1 text-xs ${activeTab === "home" ? "text-blue-500" : ""}`}>Home</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="messages" onClick={() => setActiveTab("messages")} className="py-3">
                            <div className="flex flex-col items-center">
                                <MessageSquare className={`h-5 w-5 ${activeTab === "messages" ? "text-blue-500" : ""}`} />
                                <span className={`mt-1 text-xs ${activeTab === "messages" ? "text-blue-500" : ""}`}>Messages</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="profile" onClick={() => setActiveTab("profile")} className="py-3">
                            <div className="flex flex-col items-center">
                                <User className={`h-5 w-5 ${activeTab === "profile" ? "text-blue-500" : ""}`} />
                                <span className={`mt-1 text-xs ${activeTab === "profile" ? "text-blue-500" : ""}`}>Profile</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                </div>
            </Tabs>
        </div>
    )
}
