'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2, Users, ArrowRight,
  Award, GraduationCap, MapPin, Phone, Mail, Globe,
  Layers, Star, Download, Sparkles, BookOpen as BookIcon, Calendar, Camera
} from 'lucide-react';
import api from '@/lib/api';

const departments = [
  { name: 'Computer Science & Engineering', code: 'CSE', students: '480+', sections: 4, color: 'from-blue-500 to-blue-600' },
  { name: 'Electronics & Communication', code: 'ECE', students: '360+', sections: 3, color: 'from-purple-500 to-purple-600' },
  { name: 'Electrical & Electronics', code: 'EEE', students: '240+', sections: 2, color: 'from-green-500 to-emerald-600' },
  { name: 'Mechanical Engineering', code: 'MECH', students: '300+', sections: 3, color: 'from-orange-500 to-red-500' },
  { name: 'Civil Engineering', code: 'CIVIL', students: '180+', sections: 2, color: 'from-cyan-500 to-blue-500' },
  { name: 'Information Technology', code: 'IT', students: '240+', sections: 2, color: 'from-pink-500 to-rose-600' },
];

const leadership = [
  { name: 'Dr. Lavu Rathaiah', role: 'Founder & Chairman', image: '/images/chairman.jpg', desc: 'Visionary founder of the Vignan Group of Institutions, established in 1999. Leading the group towards excellence in education and innovation.', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Mr. Shravan Boyapati', role: 'CEO, Vignan Group', image: '/images/shravan.jpg', desc: 'Driving the strategic growth and modernization of Vignan institutions with a focus on technology and student outcomes.', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Dr. G. Durga Sukumar', role: 'Principal, VGNT', image: '/images/principal.jpg', desc: 'Leading academic and administrative excellence at VGNT Deshmukhi. Committed to advancing quality education and research.', gradient: 'from-green-500 to-emerald-600' },
];

export default function LandingPage() {
  const [magazines, setMagazines] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    // Optionally fetch public data
    api.get('/college-magazines').then(res => setMagazines(Array.isArray(res) ? res : [])).catch(() => {});
    api.get('/college-gallery').then(res => setGallery(Array.isArray(res) ? res : [])).catch(() => {});
    api.get('/announcements').then(res => setAnnouncements(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  const importantAnnouncements = announcements.filter(a => a.isImportant);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Red Scrolling Info Bar */}
      {importantAnnouncements.length > 0 && (
        <div className="bg-red-600 text-white font-semibold text-sm py-2 overflow-hidden flex whitespace-nowrap mt-16 z-40 relative">
            <span className="shrink-0 animate-[marquee_20s_linear_infinite] px-4 flex gap-12 text-md tracking-wide">
                {importantAnnouncements.map((ann, i) => (
                    <span key={i} className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> {ann.title}: {ann.message}
                    </span>
                ))}
            </span>
             <span className="shrink-0 animate-[marquee_20s_linear_infinite] px-4 flex gap-12 text-md tracking-wide">
                {importantAnnouncements.map((ann, i) => (
                    <span key={`dup-${i}`} className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> {ann.title}: {ann.message}
                    </span>
                ))}
            </span>
        </div>
      )}

      <style jsx global>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        @keyframes marquee-up {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
        }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-[hsl(var(--border))] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-100 shadow-sm flex items-center justify-center overflow-hidden">
              <Image src="/images/logo.png" alt="VGNT Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">VGNT</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))] block -mt-1 leading-tight">Vignan Deshmukhi</span>
            </div>
          </div>
          <Link href="/login">
            <Button variant="gradient" size="sm">
              Staff / Student Login <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative min-h-[92vh] flex items-center overflow-hidden ${importantAnnouncements.length === 0 ? 'pt-16' : ''}`}>
        <div className="absolute inset-0 z-0">
          <img src="/images/campus2.jpg" alt="VGNT Campus" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/92 via-indigo-950/88 to-purple-950/80" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-20 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center p-1">
                  <Image src="/images/logo.png" alt="Logo" width={64} height={64} className="rounded-full object-contain" />
                </div>
                <div>
                  <p className="text-blue-300 font-semibold text-sm tracking-widest uppercase">Vignan Institute of Technology & Science</p>
                  <p className="text-blue-400/60 text-xs mt-0.5">(Autonomous) | Deshmukhi, Hyderabad</p>
                </div>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-6">
                Shaping Tomorrow&apos;s
                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Engineers & Leaders
                </span>
              </h1>
              <p className="text-lg text-blue-100/80 mb-8 max-w-xl leading-relaxed">
                A premier engineering institution founded by Dr. Lavu Rathaiah, committed to academic excellence,
                innovation, and holistic development. NBA Accredited programs with world-class infrastructure
                and 95%+ placement record.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login">
                  <Button variant="gradient" size="lg" className="text-lg px-8 py-6 shadow-2xl shadow-blue-500/25">
                    V-Connect Portal <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-3 flex-wrap">
                {['NBA Accredited', 'NAAC A+ Grade', 'AICTE Approved', 'Autonomous'].map((badge) => (
                  <span key={badge} className="px-4 py-1.5 bg-white/10 rounded-full text-xs text-blue-200 border border-white/15 backdrop-blur-sm font-medium">
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden lg:block">
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-48 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
                  <img src="/images/campus1.jpg" alt="VGNT Campus" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                  <h3 className="text-white text-lg font-bold mb-6">Why Choose VGNT?</h3>
                  <div className="space-y-4">
                    {[
                      { icon: GraduationCap, label: '95%+ Placement Rate', desc: 'Top recruiters every year', color: 'text-green-400' },
                      { icon: Building2, label: '6+ Departments', desc: 'UG & PG programs', color: 'text-blue-400' },
                      { icon: Award, label: 'NBA Accredited', desc: 'Recognized excellence', color: 'text-yellow-400' },
                      { icon: Users, label: '5000+ Students', desc: 'Vibrant campus community', color: 'text-purple-400' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + i * 0.2 }}
                        className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
                        <div>
                          <span className="text-white/90 text-sm font-medium">{item.label}</span>
                          <p className="text-white/50 text-xs">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white dark:bg-gray-900 border-y border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '5000+', label: 'Students', icon: Users },
              { value: '200+', label: 'Faculty', icon: GraduationCap },
              { value: '6+', label: 'Departments', icon: Building2 },
              { value: '95%+', label: 'Placements', icon: Award },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission from vignanits.ac.in */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Vision & Mission</h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-4 max-w-2xl mx-auto">Our guiding principles as per Vignan Institute of Technology and Science</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl h-full border border-blue-100 dark:border-blue-900/30">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6">
                  <Star className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">
                  &quot;To evolve into a center of excellence in Science and Technology through creative and innovative practices in teaching-learning, promoting academic achievement & research excellence to produce internationally accepted, competitive, and world class professionals who are psychologically strong and emotionally balanced imprinted with social ethics.&quot;
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}>
              <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl h-full border border-purple-100 dark:border-purple-900/30">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mb-6">
                  <Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h3>
                <ul className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3"><ArrowRight className="w-6 h-6 mt-0.5 shrink-0 text-purple-500" /> To provide high quality academic programmes, training activities, research facilities.</li>
                  <li className="flex items-start gap-3"><ArrowRight className="w-6 h-6 mt-0.5 shrink-0 text-purple-500" /> To promote continuous industry-institute interaction for employability, entrepreneurship, leadership and research aptitude.</li>
                  <li className="flex items-start gap-3"><ArrowRight className="w-6 h-6 mt-0.5 shrink-0 text-purple-500" /> To contribute to the economical and technological development.</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Our Leadership</h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-4 max-w-2xl mx-auto">Guided by visionary leaders committed to transforming education</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {leadership.map((leader, i) => (
              <motion.div key={leader.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}>
                <Card className="h-full hover:shadow-soft-lg transition-all text-center group">
                  <CardContent className="p-8">
                    {leader.image ? (
                      <div className="w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden border-4 border-white shadow-xl group-hover:scale-110 transition-transform relative ring-2 ring-primary/20 bg-gray-100">
                        <Image src={leader.image} alt={leader.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${leader.gradient} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                        <Star className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-1">{leader.name}</h3>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">{leader.role}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{leader.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20 bg-[hsl(var(--secondary))]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Our Departments</h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-4 max-w-2xl mx-auto">Offering comprehensive undergraduate and postgraduate programs across engineering disciplines</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, i) => (
              <motion.div key={dept.code} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                <Card className="h-full hover:shadow-soft-lg transition-all group border-transparent hover:border-[hsl(var(--primary))/20]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-mono bg-[hsl(var(--secondary))] px-2 py-1 rounded-lg">{dept.code}</span>
                    </div>
                    <h3 className="text-base font-bold mb-3">{dept.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {dept.students}</span>
                      <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {dept.sections} Sections</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Magazines & Gallery Section */}
      <section className="py-24 bg-white dark:bg-gray-900 border-y border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Campus Life & Publications
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-4 max-w-2xl mx-auto">Explore recent happenings and download our latest college magazines.</p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Gallery Column */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-3 mb-8 border-b pb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Dynamic Gallery</h3>
              </div>
              {gallery.length > 0 ? (
                <div className="h-[400px] overflow-hidden relative group">
                  <div className="grid grid-cols-2 gap-4 animate-[marquee-up_30s_linear_infinite] group-hover:[animation-play-state:paused]">
                    {[...gallery, ...gallery, ...gallery].map((img, i) => (
                      <div key={`${img.id}-${i}`} className="group relative rounded-2xl overflow-hidden shadow-sm aspect-square border-2 border-transparent hover:border-orange-200">
                        {img.imageUrl?.startsWith('data:video') || img.imageUrl?.endsWith('.mp4') ? (
                            <video src={img.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-500" />
                        ) : (
                            <img src={img.imageUrl} alt={img.title || 'Gallery'} className="w-full h-full object-cover transition-transform duration-500" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                          <div>
                             <p className="text-white font-semibold text-sm line-clamp-1">{img.title || 'Campus Selection'}</p>
                             <p className="text-white/70 text-[10px]">{img.category}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Fades */}
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white dark:from-gray-900 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="h-64 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400">
                  <Camera className="w-10 h-10 opacity-50 mb-3" />
                  <p className="text-sm">Gallery is currently being updated...</p>
                </div>
              )}
            </motion.div>

            {/* Magazines Column */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-3 mb-8 border-b pb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <BookIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">College Magazines</h3>
              </div>
              {magazines.length > 0 ? (
                <div className="h-[400px] overflow-hidden relative group">
                  <div className="space-y-4 animate-[marquee-up_25s_linear_infinite] group-hover:[animation-play-state:paused]">
                    {[...magazines, ...magazines].map((mag, i) => (
                      <div key={`${mag.id}-${i}`} className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex gap-4 border shadow-sm hover:shadow-md transition-shadow group">
                        <div className="w-20 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100 border relative">
                          {mag.thumbnailUrl ? (
                            <img src={mag.thumbnailUrl} alt={mag.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookIcon className="w-8 h-8 opacity-20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{mag.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-snug">{mag.description || 'Vignan\'s official newsletter featuring achievements, events, and campus life.'}</p>
                          <Button variant="outline" size="sm" asChild className="w-fit">
                            <a href={mag.fileUrl} target="_blank" rel="noreferrer" download={`${mag.title}.pdf`}>
                              <Download className="w-4 h-4 mr-2" /> Read Issue
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Fades */}
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white dark:from-gray-900 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="h-64 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400">
                  <Calendar className="w-10 h-10 opacity-50 mb-3" />
                  <p className="text-sm">Magazines will be available soon...</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact / Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Card className="h-full">
                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-500" /> Location</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Vignan Institute of Technology and Science<br />
                    Deshmukhi (V), Pochampally (M)<br />
                    Yadadri Bhuvanagiri (Dt)<br />
                    Telangana - 508284
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}>
              <Card className="h-full">
                <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-green-500" /> Contact</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 08685 - 222333</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> info@vignan.edu</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> www.vignanits.ac.in</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}>
              <Card className="h-full">
                <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" /> Accreditations</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">✓ NBA Accredited Programs</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">✓ NAAC A+ Grade</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">✓ AICTE Approved</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">✓ Autonomous Institution</p>
                  <Link href="/login" className="inline-flex items-center gap-1 text-sm text-blue-500 font-medium hover:underline mt-2">
                    Access V-Connect Portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-8 bg-[hsl(var(--card))]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[hsl(var(--border))] shadow-sm flex items-center justify-center overflow-hidden">
              <Image src="/images/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
            </div>
            <span className="font-bold text-lg">Vignan Institute of Technology & Science</span>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">© 2026 VGNT Deshmukhi. All rights reserved. | Powered by V-Connect</p>
        </div>
      </footer>
    </div>
  );
}
