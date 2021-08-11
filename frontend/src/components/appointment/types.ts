import { Patient } from '../patient/types'

export type ViewStyles = 'today' | 'week'

export interface Appointment {
	id: number
	status: string
	status_text: string
	patient: Patient
	start: string
	end: string
	notes: string
}

// Follows a [year][day of year][hour] format (ex: [2021][74][8] -> 74th day of 2021 at 8 AM)
type AppointmentsDictDayHour = {
	[index: number]: Appointment[]
}
type AppointmentsDictYearDay = {
	[index: number]: AppointmentsDictDayHour
}
export interface AppointmentsDict {
	[index: number]: AppointmentsDictYearDay
}
