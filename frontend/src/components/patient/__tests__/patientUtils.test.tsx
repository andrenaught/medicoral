import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { PatientForm } from '../patientUtils'
import { Patient } from '../types'

const server = setupServer(
	rest.post<Patient>('/api/patients', (req, res, ctx) => {
		const { first_name, last_name, dob } = req.body
		return res(
			ctx.status(201),
			ctx.json({
				first_name,
				last_name,
				dob,
			})
		)
	})
)

beforeAll(() => server.listen())
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

describe('<PatientForm />', () => {
	const mockOnDone = jest.fn()
	beforeEach(() => {
		render(
			<PatientForm onDone={mockOnDone} onCancel={() => {}} showAllFields />
		)
	})

	it('Creates patient with only name and dob filled in', async () => {
		fireEvent.input(screen.getByRole('textbox', { name: /first name/i }), {
			target: { value: 'Bobby' },
		})
		fireEvent.input(screen.getByRole('textbox', { name: /last name/i }), {
			target: { value: 'Smith' },
		})
		fireEvent.input(screen.getByRole('textbox', { name: /dob/i }), {
			target: { value: '4/15/1994' },
		})

		fireEvent.submit(screen.getByRole('button', { name: /create/i }))

		// Assert
		await waitFor(() => {
			expect(mockOnDone).toHaveBeenCalledWith({
				first_name: 'Bobby',
				last_name: 'Smith',
				dob: '4/15/1994',
			})
		})
	})
})
