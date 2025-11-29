'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Clock,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Flame,
  Building2,
  FileText,
  RefreshCw,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalLeads: number;
  hotLeads: number;
  recentActivity: {
    newUsersToday: number;
    newJobsToday: number;
    newLeadsToday: number;
  };
}

interface Lead {
  id: string;
  sessionId: string;
  collectedData: {
    positions?: string;
    salary?: string;
    location?: string;
    workHours?: string;
    housing?: string;
    experience?: string;
    languages?: string;
    foreignWorkers?: string;
    contactEmail?: string;
    contactPhone?: string;
    companyName?: string;
  };
  conversationHistory: Array<{ role: string; content: string }>;
  lastActivity: string;
  createdAt: string;
  isHotLead: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showHotOnly, setShowHotOnly] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Niste prijavljeni. Prijavite se kao admin.');
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch stats and leads in parallel
      const [statsRes, leadsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers }),
        fetch(`${API_URL}/api/admin/leads?hot=${showHotOnly}`, { headers }),
      ]);

      if (!statsRes.ok || !leadsRes.ok) {
        if (statsRes.status === 401 || leadsRes.status === 401) {
          setError('Nemate pristup. Prijavite se kao admin.');
        } else if (statsRes.status === 403 || leadsRes.status === 403) {
          setError('Nemate admin prava za pristup ovoj stranici.');
        } else {
          setError('Greška pri učitavanju podataka.');
        }
        setLoading(false);
        return;
      }

      const statsData = await statsRes.json();
      const leadsData = await leadsRes.json();

      setStats(statsData.data);
      setLeads(leadsData.data.leads);
    } catch (err) {
      setError('Greška pri povezivanju sa serverom.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showHotOnly]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 text-red-700 p-6 rounded-lg">
            <p className="font-semibold mb-2">Greška</p>
            <p>{error}</p>
            <Link
              href="/prijava"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Prijavi se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Tražim-Radnike<span className="text-slate-400">.online</span>
            </Link>
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
              ADMIN
            </span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Osveži
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm text-slate-500">Korisnici</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
              <p className="text-xs text-green-600 mt-1">+{stats.recentActivity.newUsersToday} danas</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm text-slate-500">Oglasi</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalJobs}</p>
              <p className="text-xs text-green-600 mt-1">+{stats.recentActivity.newJobsToday} danas</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm text-slate-500">Leadovi</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalLeads}</p>
              <p className="text-xs text-green-600 mt-1">+{stats.recentActivity.newLeadsToday} danas</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-sm text-slate-500">Vrući leadovi</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.hotLeads}</p>
              <p className="text-xs text-orange-600 mt-1">Zainteresovani za strance</p>
            </div>
          </div>
        )}

        {/* Leads Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leads List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Leadovi iz chatbota</h2>
              <button
                onClick={() => setShowHotOnly(!showHotOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showHotOnly
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Flame className="h-4 w-4" />
                {showHotOnly ? 'Samo vrući' : 'Svi leadovi'}
              </button>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {leads.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Nema leadova za prikaz</p>
                </div>
              ) : (
                leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      selectedLead?.id === lead.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {lead.isHotLead && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                              <Flame className="h-3 w-3" />
                              VRUĆI
                            </span>
                          )}
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {lead.collectedData.positions || 'Nije navedeno'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {lead.collectedData.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.collectedData.location}
                            </span>
                          )}
                          {lead.collectedData.contactEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.collectedData.contactEmail}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDate(lead.lastActivity)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-slate-900">Detalji leada</h2>
            </div>

            {selectedLead ? (
              <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                {/* Lead Status */}
                <div className="flex items-center gap-2">
                  {selectedLead.isHotLead ? (
                    <span className="flex items-center gap-1 text-sm font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                      <Flame className="h-4 w-4" />
                      VRUĆI LEAD - Zainteresovan za strane radnike
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      Standardni lead
                    </span>
                  )}
                </div>

                {/* Collected Data */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Prikupljeni podaci</h3>
                  <div className="grid gap-3">
                    {selectedLead.collectedData.positions && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Briefcase className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Pozicije</p>
                          <p className="text-sm font-medium text-slate-900">{selectedLead.collectedData.positions}</p>
                        </div>
                      </div>
                    )}

                    {selectedLead.collectedData.salary && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Plata</p>
                          <p className="text-sm font-medium text-slate-900">{selectedLead.collectedData.salary}</p>
                        </div>
                      </div>
                    )}

                    {selectedLead.collectedData.location && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Lokacija</p>
                          <p className="text-sm font-medium text-slate-900">{selectedLead.collectedData.location}</p>
                        </div>
                      </div>
                    )}

                    {selectedLead.collectedData.housing && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Building2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Smeštaj</p>
                          <p className="text-sm font-medium text-slate-900">{selectedLead.collectedData.housing}</p>
                        </div>
                      </div>
                    )}

                    {selectedLead.collectedData.workHours && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Radno vreme</p>
                          <p className="text-sm font-medium text-slate-900">{selectedLead.collectedData.workHours}</p>
                        </div>
                      </div>
                    )}

                    {selectedLead.collectedData.experience && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <FileText className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Iskustvo</p>
                          <p className="text-sm font-medium text-slate-900">{selectedLead.collectedData.experience}</p>
                        </div>
                      </div>
                    )}

                    {selectedLead.collectedData.foreignWorkers && (
                      <div className={`flex items-start gap-3 p-3 rounded-lg ${
                        selectedLead.isHotLead ? 'bg-orange-50' : 'bg-slate-50'
                      }`}>
                        <Flame className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          selectedLead.isHotLead ? 'text-orange-600' : 'text-slate-600'
                        }`} />
                        <div>
                          <p className="text-xs text-slate-500">Strani radnici</p>
                          <p className={`text-sm font-medium ${
                            selectedLead.isHotLead ? 'text-orange-700' : 'text-slate-900'
                          }`}>
                            {selectedLead.collectedData.foreignWorkers}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                {(selectedLead.collectedData.contactEmail || selectedLead.collectedData.contactPhone) && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Kontakt podaci</h3>
                    <div className="space-y-2">
                      {selectedLead.collectedData.contactEmail && (
                        <a
                          href={`mailto:${selectedLead.collectedData.contactEmail}`}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Mail className="h-5 w-5" />
                          <span className="text-sm font-medium">{selectedLead.collectedData.contactEmail}</span>
                        </a>
                      )}
                      {selectedLead.collectedData.contactPhone && (
                        <a
                          href={`tel:${selectedLead.collectedData.contactPhone}`}
                          className="flex items-center gap-3 p-3 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <Phone className="h-5 w-5" />
                          <span className="text-sm font-medium">{selectedLead.collectedData.contactPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Conversation History */}
                {selectedLead.conversationHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      Istorija razgovora ({selectedLead.conversationHistory.length} poruka)
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedLead.conversationHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg text-sm ${
                            msg.role === 'user'
                              ? 'bg-blue-50 text-blue-900 ml-4'
                              : 'bg-slate-100 text-slate-700 mr-4'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">
                            {msg.role === 'user' ? 'Klijent' : 'Botislav'}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-slate-400 pt-4 border-t">
                  <p>Kreiran: {formatDate(selectedLead.createdAt)}</p>
                  <p>Poslednja aktivnost: {formatDate(selectedLead.lastActivity)}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <ChevronRight className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Izaberite lead sa liste za prikaz detalja</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
