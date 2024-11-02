const API_URL = 'https://barbeariagenese.ddns.net:8182/api'; 'https://138.204.143.189:8182/api/' ;

// Função para verificar a URL atual
function isDashboardPage() {
    return window.location.pathname.includes('dashboard.html');
}

// Função para gerar horários fixos
function generateTimeSlots(date, occupiedSlots) {
    const slots = [];
    const day = new Date(date).getDay();

    // Horários disponíveis
    if (day === 6) { // Domingo
        for (let hour = 8; hour < 12; hour++) {
            const slot = `${hour.toString().padStart(2, '0')}:00`;
            if (!occupiedSlots.includes(slot)) slots.push(slot);
        }
    } else if (day >= 0 && day <= 5) { // Segunda a sexta
        for (let hour = 7; hour < 19; hour++) {
            const slot = `${hour.toString().padStart(2, '0')}:00`;
            if (!occupiedSlots.includes(slot)) slots.push(slot);
        }
    }

    return slots;
}

async function updateTimeSlots() {
    const dateInput = document.getElementById('date');
    const timeSlotSelect = document.getElementById('timeSlot');
    const selectedDate = dateInput.value;
    timeSlotSelect.innerHTML = '';

    if (selectedDate) {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/appointments?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let occupiedSlots = [];
            if (response.ok) {
                const appointments = await response.json();
                occupiedSlots = appointments.map(appointment => {
                    const dateTime = new Date(appointment.dateTime);
                    return dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                });
            }

            const timeSlots = generateTimeSlots(selectedDate, occupiedSlots);
            timeSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;
                timeSlotSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            alert('Erro ao carregar horários ocupados');
        }
    }
}

// Função para verificar e carregar o usuário logado
async function handleLogin() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('loggedUsername');

    if (!token || !username) {
        alert("Por favor, faça login.");
        window.location.href = 'login.html';
        return null;
    }

    if (username === 'admin' || username === 'root') {
        window.location.href = 'admin-dashboard.html';
    } else {
        loadAppointments(username);
    }
    return username;
}

// Função para carregar agendamentos de um usuário específico
async function loadAppointments(username) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/appointments?username=${username}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro na requisição dos agendamentos');

        const appointments = await response.json();
        const appointmentsDiv = document.getElementById('appointments');

        if (appointments.length === 0) {
            appointmentsDiv.innerHTML = '<p>Você ainda não fez seu Agendamento, Por favor! Agende seu Serviço.</p>';
        } else {
            appointmentsDiv.innerHTML = appointments.map(appointment => `
                <div>
                    <p>${appointment.serviceType} - ${new Date(appointment.dateTime).toLocaleString()}</p>
                    <button onclick="rescheduleAppointment('${appointment._id}')">Remarcar</button>
                    <button onclick="cancelAppointment('${appointment._id}')">Cancelar</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar os agendamentos:', error);
        alert('Erro ao carregar os agendamentos');
    }
}

// Registro de usuários
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            alert('Usuário registrado com sucesso');
            window.location.href = 'login.html';
        } else {
            const errorData = await response.json();
            alert(`Erro ao registrar o usuário: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Erro ao registrar o usuário:', error);
        alert('Erro ao conectar ao servidor');
    }
});

// Login de usuários
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('loggedUsername', username);

        if (username === 'admin' || username === 'root') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
            loadAppointments(username);
        }
    } else {
        const error = await response.json();
        alert(error.message);
    }
});

// Executa no dashboard ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!isDashboardPage() || !token) return;

    document.getElementById('date')?.addEventListener('change', updateTimeSlots);
    handleLogin();
});

// Agendar um novo horário
document.getElementById('appointmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const serviceType = document.getElementById('serviceType').value;
    const dateTime = `${document.getElementById('date').value}T${document.getElementById('timeSlot').value}:00`;
    const username = localStorage.getItem('loggedUsername'); // Obtém o usuário logado
    const author = 'administrador'; // Define o autor como "administrador"

    if (!serviceType || !dateTime || !username) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ serviceType, dateTime, username, author })
        });

        if (response.ok) {
            alert('Agendamento realizado com sucesso');
            window.location.reload();
        } else {
            alert('Você já tem um agendamento futuro. Cancele ou remarque o atual antes de agendar outro.');
        }
    } catch (error) {
        console.error('Erro ao agendar:', error);
        alert('Erro ao conectar ao servidor');
    }
});

////////////////////// Remarcar horário \\\\\\\\\\\\\\\\\\\\\

async function rescheduleAppointment(id) {
    console.log("ID do agendamento:", id);  // Para depurar, verificar o ID no console
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao obter os detalhes do agendamento');
        }

        const appointment = await response.json();
        const appointmentInfo = `Serviço atual: ${appointment.serviceType}\nData e Hora atual: ${new Date(appointment.dateTime).toLocaleString()}`;

        const userConfirmed = confirm(`Barbearia Gênese diz:\nVocê realmente deseja remarcar um novo horário?\n\n${appointmentInfo}`);

        if (userConfirmed) {
            const newServiceType = prompt("Selecione o novo serviço (ex: Corte, Barba, etc.):", appointment.serviceType);
            if (!newServiceType) return;

            const newDate = prompt("Escolha uma nova data (formato: YYYY-MM-DD):");
            if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
                alert('Data inválida. Por favor, insira no formato YYYY-MM-DD.');
                return;
            }

            const occupiedSlotsResponse = await fetch(`${API_URL}/appointments?date=${newDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let occupiedSlots = [];
            if (occupiedSlotsResponse.ok) {
                const appointments = await occupiedSlotsResponse.json();
                occupiedSlots = appointments.map(appt => {
                    const dateTime = new Date(appt.dateTime);
                    return dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                });
            }

            const availableSlots = generateTimeSlots(newDate, occupiedSlots);
            const newTimeSlot = prompt(`Escolha um novo horário (disponíveis: ${availableSlots.join(', ')}):`);
            if (!availableSlots.includes(newTimeSlot)) {
                alert('Horário inválido ou já ocupado. Por favor, selecione um horário válido.');
                return;
            }

            const newDateTime = `${newDate}T${newTimeSlot}:00`;
            const finalConfirmation = confirm(`Confirme os detalhes da remarcação:\nServiço: ${newServiceType}\nData e Hora: ${newDateTime}`);

            if (finalConfirmation) {
                const rescheduleResponse = await fetch(`${API_URL}/appointments/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ serviceType: newServiceType, dateTime: newDateTime })
                });

                if (rescheduleResponse.ok) {
                    alert('Horário remarcado com sucesso');
                    window.location.reload();
                } else {
                    alert('Erro ao remarcar o horário. Por favor, tente novamente.');
                }
            }
        }
    } catch (error) {
        console.error("Erro ao remarcar:", error);
        alert('Erro ao conectar ao servidor');
    }
}


// Cancelar agendamento
async function cancelAppointment(id) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

        if (response.ok) {
            alert('Agendamento cancelado com sucesso');
            window.location.reload();
            }
            else {
                alert('Erro ao cancelar o agendamento');
                }
            }
                catch (error) {
                    console.error("Erro ao cancelar:", error);
                     alert('Erro ao conectar ao servidor');
                    }
                }

document.getElementById('logoutButton')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('loggedUsername');
    window.location.href = 'login.html';
});
