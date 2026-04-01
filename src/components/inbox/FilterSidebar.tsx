'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FilterState {
  sources: string[]
  department?: string
  statuses: string[]
  priorities: string[]
  dateFrom?: string
  dateTo?: string
}

interface FilterSidebarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

const SOURCES = ['Newsletter', 'Web', 'Email', 'Phone', 'Mail']
const STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED']
const PRIORITIES = ['URGENT', 'HIGH', 'NORMAL', 'LOW']

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  const hasActiveFilters =
    filters.sources.length > 0 ||
    filters.department ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.dateFrom ||
    filters.dateTo

  const handleSourceChange = (source: string, checked: boolean) => {
    const newSources = checked
      ? [...filters.sources, source]
      : filters.sources.filter((s) => s !== source)
    onFilterChange({ ...filters, sources: newSources })
  }

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter((s) => s !== status)
    onFilterChange({ ...filters, statuses: newStatuses })
  }

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const newPriorities = checked
      ? [...filters.priorities, priority]
      : filters.priorities.filter((p) => p !== priority)
    onFilterChange({ ...filters, priorities: newPriorities })
  }

  const handleDateFromChange = (value: string) => {
    onFilterChange({ ...filters, dateFrom: value || undefined })
  }

  const handleDateToChange = (value: string) => {
    onFilterChange({ ...filters, dateTo: value || undefined })
  }

  const handleClearAll = () => {
    onFilterChange({
      sources: [],
      department: undefined,
      statuses: [],
      priorities: [],
      dateFrom: undefined,
      dateTo: undefined,
    })
  }

  return (
    <div className="relative">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 hover:bg-muted rounded-lg mb-4 flex items-center gap-2"
      >
        <span className="text-sm font-semibold">Filters</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Sidebar */}
      <Card
        className={`absolute md:relative inset-y-0 left-0 z-40 md:z-auto w-64 md:w-auto md:sticky md:top-0 ${
          isOpen ? '' : 'hidden md:block'
        } bg-card rounded-lg border`}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between md:justify-start">
            <h2 className="font-semibold text-lg">Filters</h2>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Source Filter */}
          <Accordion type="single" collapsible defaultValue="source">
            <AccordionItem value="source">
              <AccordionTrigger className="text-sm font-semibold py-2">
                Source
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {SOURCES.map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source}`}
                      checked={filters.sources.includes(source)}
                      onCheckedChange={(checked) =>
                        handleSourceChange(source, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`source-${source}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {source}
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Status Filter */}
          <Accordion type="single" collapsible defaultValue="status">
            <AccordionItem value="status">
              <AccordionTrigger className="text-sm font-semibold py-2">
                Status
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {STATUSES.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={(checked) =>
                        handleStatusChange(status, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {status.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Priority Filter */}
          <Accordion type="single" collapsible defaultValue="priority">
            <AccordionItem value="priority">
              <AccordionTrigger className="text-sm font-semibold py-2">
                Priority
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {PRIORITIES.map((priority) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filters.priorities.includes(priority)}
                      onCheckedChange={(checked) =>
                        handlePriorityChange(priority, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`priority-${priority}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {priority}
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Date Range Filter */}
          <Accordion type="single" collapsible>
            <AccordionItem value="date">
              <AccordionTrigger className="text-sm font-semibold py-2">
                Date Range
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="date-from" className="text-xs font-semibold mb-1 block">
                    From
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="date-to" className="text-xs font-semibold mb-1 block">
                    To
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Card>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
