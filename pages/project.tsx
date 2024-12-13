import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // pour la gestion des interactions
import { supabase } from '../lib/supabaseClient'; // Assurez-vous que votre fichier supabase.ts est correct
import { FaPlus, FaMinus, FaCheckCircle, FaRegClock } from 'react-icons/fa'; // Icônes pour les interactions et les tâches

// Importer la locale française de FullCalendar
import '@fullcalendar/core/locales/fr';
type TaskType = {
  title: string;
  status: boolean;
};
type EventType = {
  title: string;
  start_date: string;
  end_date: string;
  tasks: TaskType[];
  // Ajoutez d'autres propriétés nécessaires ici
};

const Project = () => {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]); // Stocker les événements chargés depuis Supabase
  const [loading, setLoading] = useState<boolean>(true); // Indicateur de chargement
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null); // ID du projet sélectionné pour afficher les détails
  const [calendarRange, setCalendarRange] = useState<{ start: Date; end: Date } | null>(null); // Plage de dates visible dans le calendrier

  // Liste des couleurs pour les projets
  const COLORS = [
    '#7dd3fc', '#6ee7b7', '#bef264', '#fde047', '#fdba74', '#fca5a5', '#5eead4', '#fb923c', '#99f6e4', '#0891b2',
  ];

  // Fonction pour récupérer les événements (projets) et les tâches associées
  const fetchEvents = async () => {
    setLoading(true);

    try {
      const { data: projectData, error: projectError } = await supabase.from('projects').select('*');
      if (projectError) throw projectError;

      const formattedEvents = await Promise.all(
        projectData.map(async (project: any, index: number) => {
          const [taskData, expenseData] = await Promise.all([
            // Récupérer les tâches du projet
            supabase.from('tasks').select('*').eq('project_id', project.id),
            // Récupérer les dépenses associées au projet
            supabase.from('expenses').select('total').eq('project_id', project.id),
          ]);

          // Calcul des tâches
          const completedTasks = taskData.data?.filter((task: any) => task.status).length || 0;
          const totalTasks = taskData.data?.length || 0;
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

          // Calcul des dépenses
          const totalExpenses = expenseData.data?.reduce((sum, expense) => sum + expense.total, 0) || 0;

          return {
            title: project.title,
            start: project.start_date,
            end: project.end_date || project.start_date,
            backgroundColor: COLORS[index % COLORS.length],
            id: project.id,
            description: project.description,
            start_date: project.start_date,
            end_date: project.end_date,
            estimated_cost: project.estimated_cost,
            tasks: taskData.data || [],
            progress,
            total_expenses: totalExpenses,
          };
        })
      );

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les projets en fonction de la plage de dates visible
  const filterProjectsByDateRange = (projects: any[]) => {
    if (!calendarRange) return projects;

    return projects.filter((project) => {
      const projectStart = new Date(project.start_date);
      const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;

      return (
        (projectStart >= calendarRange.start && projectStart <= calendarRange.end) ||
        (projectEnd >= calendarRange.start && projectEnd <= calendarRange.end) ||
        (projectStart <= calendarRange.start && projectEnd >= calendarRange.end)
      );
    });
  };

  useEffect(() => {
    fetchEvents(); // Charger les événements au montage du composant
  }, []);

  // Fonction pour gérer la mise à jour de la plage de dates lors du changement de vue du calendrier
  const handleDateChange = (info: any) => {
    const start = info.view.currentStart;
    const end = info.view.currentEnd;
    setCalendarRange({ start, end });

    let formattedDate = '';
    if (info.view.type === 'dayGridMonth') {
      formattedDate = start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (info.view.type === 'dayGridDay') {
      formattedDate = start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    } else if (info.view.type === 'dayGridWeek') {
      const weekStart = start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      const weekEnd = end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      formattedDate = `du ${weekStart} au ${weekEnd}`;
    }

    setCurrentDate(formattedDate); // Mettre à jour la date ou la plage de dates
  };

  // Fonction pour basculer l'affichage des détails d'un projet
  const handleToggleDetails = (projectId: number) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const filteredProjects = filterProjectsByDateRange(events); // Filtrer les projets en fonction de la plage de dates

  return (
    <div className="w-full min-h-screen bg-gray-50 px-2 py-2">
      {/* Afficher la date ou plage de dates de la vue actuelle */}
      {currentDate && (
        <div className="text-center text-lg text-gray-800">
          {currentDate}
        </div>
      )}

      {/* Calendrier avec FullCalendar */}
      <FullCalendar
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  editable={true}
  selectable={true}
  events={events} // Les événements formatés avec les couleurs des projets
  locale="fr"
  headerToolbar={{
    left: 'prev,next today',
    center: '',
    right: 'dayGridMonth,dayGridWeek',
  }}
  
  contentHeight="auto"
  aspectRatio={2}
  buttonText={{
    today: 'Today',
    month: 'Mois',
    week: 'Semaine',
  }}
  dayCellContent={(arg) => (
    <div style={{ fontSize: '10px', lineHeight: '1' }}>
      {arg.dayNumberText} {/* Affiche les chiffres des jours */}
    </div>
  )}
  dayHeaderContent={(arg) => (
    <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#555' }}>
      {arg.text} {/* Affiche les noms des jours */}
    </div>
  )}
  eventContent={(arg) => {
    const projectColor = arg.event.extendedProps.backgroundColor;
    return (
      <div
        style={{
          height: '6px', // Réduire la hauteur des barres des projets
          backgroundColor: projectColor, // Appliquer la couleur des projets
          borderRadius: '2px',
          marginTop: '2px',
          
        }}
      ></div>
    );
  }}
  datesSet={handleDateChange}
  navLinks={true}
  themeSystem="bootstrap"
  fixedWeekCount={false}
/>


      {/* Affichage des projets filtrés en bas du calendrier */}
      <div className="mt-2">
      <div className="flex justify-between items-center">
  {/* Affichage de la date actuelle */}
  <h2 className="text-lg font-bold text-gray-700">
    Projets en cours
  </h2>
  {currentDate && (
    <div className="text-lg text-gray-800">
      {currentDate}
    </div>
  )}
  {/* Titre des projets */}
 
</div>       
 <div className="w-full mt-2">
          {filteredProjects.map((event, index) => (
            <div
              key={index}
              className={`flex flex-col bg-white p-2 mb-2 rounded-lg shadow-md transition-all ${expandedProjectId === event.id ? 'h-auto' : 'h-16'}`} 
              style={{ borderLeft: `16px solid ${event.backgroundColor}` }} // Couleur à gauche
            >
              <div className="flex items-center justify-between">
                <h3 className="ml-2 text-sm font-semibold text-gray-800">{event.title}</h3>
                
                {/* Bouton "+" ou "-" à droite */}
                <button
                  onClick={() => handleToggleDetails(event.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {expandedProjectId === event.id ? <FaMinus size={20} /> : <FaPlus size={20} />}
                </button>
              </div>

              {/* Affichage de la barre de progression sous le titre (avant l'extension) */}
              {expandedProjectId !== event.id && (
                <>
                  <div className="w-full mt-1 bg-gray-200 rounded-sm h-1">
                    <div
                      className="h-full bg-green-500 rounded-sm"
                      style={{ width: `${event.progress}%` }}
                    />
                  </div>
                  <div className="text-center text-xs text-gray-600 mt-1">
                    {Math.round(event.progress)}% Progression
                  </div>
                </>
              )}

              {/* Affichage des détails sous le titre */}
              {expandedProjectId === event.id && (
                <div className="mt-2 text-gray-700 text-sm w-full">
                  <div className="flex justify-between">
                    <p>Date début: {new Date(event.start_date).toLocaleDateString('fr-FR')}</p>
                    <p>Date fin: {event.end_date ? new Date(event.end_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
                  </div>
                  <p>Nombre de jours: {event.end_date ? Math.ceil((new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 3600 * 24)) : 'Non spécifié'}</p>
                  <p><strong>Coût estimé:</strong> {event.estimated_cost ? `${event.estimated_cost} TND` : 'Non spécifié'}</p>
                  <p><strong>Dépense totale:</strong> {event.total_expenses ? `${event.total_expenses.toLocaleString('fr-FR')} TND` : '0 TND'}</p>

                  <p>Tâches du projet:</p>
                  {/* Affichage des tâches avec icônes */}
                  {event.tasks.length > 0 ? (
  <ul className="list-disc pl-4">
    {event.tasks.map((task: TaskType, taskIndex: React.Key | null | undefined) => (
      <li key={taskIndex} className="text-sm flex items-center space-x-2">
        {/* Affichage de l'icône en fonction du statut de la tâche */}
        {task.status ? (
          <FaCheckCircle className="text-green-500" />
        ) : (
          <FaRegClock className="text-yellow-500" />
        )}
        <span>{task.title}</span>
      </li>
    ))}
  </ul>
) : (
  <p>Aucune tâche associée.</p>
)}

                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
Project.protected = true;
export default Project;
