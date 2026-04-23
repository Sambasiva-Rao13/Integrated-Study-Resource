export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    roll_number?: string;
    employee_id?: string;
    branch?: string;
    semester?: string;
    regulation?: string;
    section?: string;
    subjects_handled?: string[];
    created_at: string;
    updated_at?: string;
}

export interface Material {
    id: string;
    title: string;
    category: 'previous_questions' | 'jntuk_materials' | 'assignment_questions' | 'provided_materials';
    regulation: string;
    semester: string;
    section: string;
    subject: string;
    file_url: string;
    file_name: string;
    file_size: number;
    uploaded_by: string;
    uploaded_at: string;
    updated_at?: string;
}

export interface ChatMessage {
    id: string;
    user_id: string;
    query: string;
    ai_response: string;
    context_material_id?: string;
    created_at: string;
}
