"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function ExampleForm() {
  const [selectedOption, setSelectedOption] = useState("Select an option")

  return (
    <div className="max-w-md space-y-4 p-4">
      {/* Basic Input */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input id="name" placeholder="Enter your name" />
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </div>

      {/* Textarea */}
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <Textarea id="message" placeholder="Type your message here" />
      </div>

      {/* Dropdown Menu */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Options</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedOption}
              <span className="ml-2">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            <DropdownMenuItem onClick={() => setSelectedOption("Option 1")}>Option 1</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedOption("Option 2")}>Option 2</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedOption("Option 3")}>Option 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Submit Button */}
      <Button className="w-full">Submit</Button>
    </div>
  )
}

