import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { FC } from "react";

interface AddCreditProps {
    onCancel: () => void;
}
type AddCreditComponent = FC<AddCreditProps> & { protected?: boolean };

const AddCredit: AddCreditComponent = ({ onCancel }) => {
    const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
    const [formData, setFormData] = useState({
        amount: "",
        annualInterestRate: "",
        startDate: "",
        duration: "",
        monthlyInsurance: "",
        participants: [] as string[],
    });
    const [loading, setLoading] = useState(false);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase.from("users").select("id, email");
            if (error) console.error(error);
            else setUsers(data);
        };
        fetchUsers();
    }, []);

    const calculateResults = () => {
        const amount = parseFloat(formData.amount);
        const annualRate = parseFloat(formData.annualInterestRate) / 100;
        const duration = parseInt(formData.duration);
        const insurance = parseFloat(formData.monthlyInsurance);

        const monthlyRate = annualRate / 12;
        const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration));
        const monthlyPaymentWithInsurance = monthlyPayment + insurance;
        const totalPayment = monthlyPaymentWithInsurance * duration;

        return {
            monthlyPayment: monthlyPaymentWithInsurance.toFixed(2),
            totalDue: totalPayment.toFixed(2),
            participantPayment: (monthlyPaymentWithInsurance / formData.participants.length).toFixed(2),
        };
    };

    const handleSubmit = async () => {
        const { monthlyPayment, totalDue, participantPayment } = calculateResults();

        const { data: credit, error } = await supabase
            .from("credits")
            .insert({
                amount: formData.amount,
                annual_interest_rate: formData.annualInterestRate,
                start_date: formData.startDate,
                duration_months: formData.duration,
                monthly_insurance: formData.monthlyInsurance,
                total_due: totalDue,
                monthly_payment: monthlyPayment,
            })
            .select("id");

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        const creditId = credit[0].id;

        const participantInsertions = formData.participants.map((userId) => ({
            credit_id: creditId,
            user_id: userId,
            participant_monthly_payment: participantPayment,
        }));

        await supabase.from("credit_participants").insert(participantInsertions);

        const payments: any[] = [];
        for (let i = 0; i < parseInt(formData.duration); i++) {
            const date = new Date(formData.startDate);
            date.setMonth(date.getMonth() + i);
        
            formData.participants.forEach((userId) => {
                payments.push({
                    credit_id: creditId,
                    user_id: userId,
                    month: date.getMonth() + 1,
                    year: date.getFullYear(),
                    amount: participantPayment,
                });
            });
        }
        

        await supabase.from("payments").insert(payments);
        setLoading(false);
        alert("Crédit créé avec succès !");
    };

    const handlePopupSubmit = () => {
        setShowConfirmationPopup(false);
        setLoading(true);
        handleSubmit();
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
            <h1 className="text-2xl font-bold mb-4">Créer un Crédit</h1>
            <form
                className="w-full max-w-lg bg-white p-6 rounded shadow-md"
                onSubmit={(e) => {
                    e.preventDefault();
                    setShowConfirmationPopup(true);
                }}
            >
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Montant du crédit</label>
                    <input
                        type="number"
                        className="w-full border rounded p-2"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Taux débiteur annuel fixe (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full border rounded p-2"
                        value={formData.annualInterestRate}
                        onChange={(e) => setFormData({ ...formData, annualInterestRate: e.target.value })}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Date de début du crédit</label>
                    <input
                        type="date"
                        className="w-full border rounded p-2"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Durée (mois)</label>
                    <input
                        type="number"
                        className="w-full border rounded p-2"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Assurance par mois</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full border rounded p-2"
                        value={formData.monthlyInsurance}
                        onChange={(e) => setFormData({ ...formData, monthlyInsurance: e.target.value })}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Participants</label>
                    <div className="border rounded p-2">
                        {users.map((user) => (
                            <div key={user.id} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    value={user.id}
                                    checked={formData.participants.includes(user.id)}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        setFormData((prevState) => ({
                                            ...prevState,
                                            participants: isChecked
                                                ? [...prevState.participants, user.id]
                                                : prevState.participants.filter((id) => id !== user.id),
                                        }));
                                    }}
                                />
                                <label>{user.email}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded shadow hover:bg-blue-600 transition duration-200"
                    disabled={loading}
                >
                    {loading ? "Création en cours..." : "Créer le crédit"}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full mt-4 bg-gray-300 text-black py-2 rounded shadow hover:bg-gray-400 transition duration-200"
                >
                    Annuler
                </button>
            </form>

            {showConfirmationPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Confirmation du crédit</h2>
                        <p><strong>Montant :</strong> {formData.amount} €</p>
                        <p><strong>Taux annuel :</strong> {formData.annualInterestRate}%</p>
                        <p><strong>Date de début :</strong> {formData.startDate}</p>
                        <p><strong>Durée :</strong> {formData.duration} mois</p>
                        <p><strong>Assurance mensuelle :</strong> {formData.monthlyInsurance} €</p>
                        <p><strong>Mensualité totale :</strong> {calculateResults().monthlyPayment} €</p>
                        <p><strong>Mensualité par participant :</strong> {calculateResults().participantPayment} €</p>
                        <p><strong>Participants :</strong> {formData.participants.map(pid => users.find(user => user.id === pid)?.email).join(", ")}</p>
                        <div className="flex justify-end mt-4">
                            <button 
                                className="px-4 py-2 bg-gray-300 rounded mr-2"
                                onClick={() => setShowConfirmationPopup(false)}
                            >
                                Annuler
                            </button>
                            <button 
                                className="px-4 py-2 bg-blue-500 text-white rounded"
                                onClick={handlePopupSubmit}
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

AddCredit.protected = true;
export default AddCredit;