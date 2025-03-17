

export async function handleRoleChange(userId: string, newRole: string, currentUserId: string) {
  try {
    // Get all active sessions
    const response = await fetch('/api/auth/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId, 
        newRole,
        currentUserId 
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to handle role change');
    }

    // Only clear cookie and redirect if the affected user is the current user
    if (userId === currentUserId) {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      window.location.href = '/auth/signin';
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling role change:', error);
    return { success: false, error };
  }
}