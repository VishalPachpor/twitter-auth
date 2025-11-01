import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
	try {
		// Verify user is authenticated
		const session = await getServerSession()
		
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		// Parse request body
		const body = await request.json()
		const { username, walletAddress, name, image, email } = body

		// Validate required fields
		if (!walletAddress || !name || !username) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		// Insert profile data into Supabase
		const { data, error } = await supabase
			.from('profiles')
			.insert({
				username,
				wallet_address: walletAddress,
				name,
				image,
				email: email || null,
				user_id: session.user.email || null,
				created_at: new Date().toISOString(),
			})
			.select()
			.single()

		if (error) {
			console.error('Supabase error:', error)
			return NextResponse.json(
				{ error: 'Failed to save profile', details: error.message },
				{ status: 500 }
			)
		}

		return NextResponse.json(
			{ success: true, data },
			{ status: 201 }
		)
	} catch (error) {
		console.error('API error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

