export interface InsuranceProvider {
	id: number
	name: string
}

export interface Patient {
	id: number
	first_name: string
	last_name: string
	email: string
	is_new: boolean
	dob?: string
	sex?: string
	phone?: string
	insurance_provider?: InsuranceProvider
	insurance_member_id?: string
}

export interface ProgressNote {
	id: number
	patient: number
	chief_complaint: string
	created_at: string
}
